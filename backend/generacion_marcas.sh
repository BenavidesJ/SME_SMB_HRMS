#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 8 ]; then
  echo "Uso:"
  echo "API_BASE IDENTIFICACION FECHA_INICIO FECHA_FIN HORA_INICIO HORA_FIN USERNAME PASSWORD [TZ_OFFSET]"
  echo "Ejemplo:"
  echo "http://localhost:3000/v1 123456789 2026-03-01 2026-03-31 08:00 17:00 admin 1234 -06:00"
  exit 1
fi

API_BASE="$1"          # Ej: http://localhost:3000/v1
IDENTIFICACION="$2"    # Ej: 123456789
FECHA_INICIO="$3"      # YYYY-MM-DD
FECHA_FIN="$4"         # YYYY-MM-DD
HORA_INICIO="$5"       # HH:MM
HORA_FIN="$6"          # HH:MM
USERNAME="$7"
PASSWORD="$8"
TZ_OFFSET="${9:--06:00}"

# Para evitar rate limit en dev (10 req/min aprox)
SLEEP_SECONDS=7

req() {
  curl -sS "$@"
}

ensure_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Falta comando requerido: $1"; exit 1; }
}

ensure_cmd jq
ensure_cmd curl
ensure_cmd date

iso_ts() {
  local d="$1"
  local hm="$2"
  printf "%sT%s:00%s" "$d" "$hm" "$TZ_OFFSET"
}

date_epoch() {
  local d="$1"
  date -j -f "%Y-%m-%d" "$d" "+%s"
}

date_add_one() {
  local d="$1"
  date -j -v+1d -f "%Y-%m-%d" "$d" "+%Y-%m-%d"
}

day_code() {
  local d="$1"
  local dow
  dow="$(date -j -f "%Y-%m-%d" "$d" "+%u")"   # 1=Lunes ... 7=Domingo
  case "$dow" in
    1) echo "L" ;;
    2) echo "M" ;;  # Martes
    3) echo "K" ;;  # Miércoles (como en backend)
    4) echo "J" ;;
    5) echo "V" ;;
    6) echo "S" ;;
    7) echo "D" ;;
    *) echo "?" ;;
  esac
}

contains_char() {
  local s="$1"
  local c="$2"
  case "$s" in
    *"$c"*) return 0 ;;
    *) return 1 ;;
  esac
}

api_msg() {
  jq -r '.message // .error // "Sin detalle"' 2>/dev/null || true
}

echo "1) Login..."
LOGIN_JSON="$(req -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")"

TOKEN="$(echo "$LOGIN_JSON" | jq -r '.data.access_token // empty')"
if [ -z "$TOKEN" ]; then
  echo "No se pudo obtener token. Respuesta:"
  echo "$LOGIN_JSON"
  exit 1
fi

AUTH_HEADER="Authorization: Bearer $TOKEN"

echo "2) Buscar colaborador por identificación..."
EMP_JSON="$(req -X GET "$API_BASE/empleados" -H "$AUTH_HEADER")"
COLAB_ID="$(echo "$EMP_JSON" | jq -r --arg ident "$IDENTIFICACION" '
  .data[]
  | select((.identificacion|tostring) == $ident)
  | .id
' | head -n1)"

if [ -z "$COLAB_ID" ] || [ "$COLAB_ID" = "null" ]; then
  echo "No se encontró colaborador con identificación $IDENTIFICACION"
  exit 1
fi
echo "Colaborador id: $COLAB_ID"

echo "3) Obtener contrato ACTIVO y horario..."
CONTRATOS_JSON="$(req -X GET "$API_BASE/empleados/$COLAB_ID/contratos" -H "$AUTH_HEADER")"

DIAS_LABORALES="$(echo "$CONTRATOS_JSON" | jq -r '
  .data[]
  | select(.estado == "ACTIVO")
  | .horarios[0].dias_laborales
' | head -n1)"

DIAS_LIBRES="$(echo "$CONTRATOS_JSON" | jq -r '
  .data[]
  | select(.estado == "ACTIVO")
  | .horarios[0].dias_libres
' | head -n1)"

if [ -z "$DIAS_LABORALES" ] || [ "$DIAS_LABORALES" = "null" ]; then
  echo "No se encontró contrato ACTIVO con horario para colaborador $COLAB_ID"
  exit 1
fi

echo "dias_laborales=$DIAS_LABORALES"
echo "dias_libres=$DIAS_LIBRES"

echo "4) Crear marcas por cada día laboral..."
current="$FECHA_INICIO"
end_epoch="$(date_epoch "$FECHA_FIN")"

while [ "$(date_epoch "$current")" -le "$end_epoch" ]; do
  code="$(day_code "$current")"

  # Trabaja si el día está en dias_laborales y no está en dias_libres
  if contains_char "$DIAS_LABORALES" "$code" && ! contains_char "$DIAS_LIBRES" "$code"; then
    ts_entrada="$(iso_ts "$current" "$HORA_INICIO")"
    ts_salida="$(iso_ts "$current" "$HORA_FIN")"

    echo "[$current][$code] ENTRADA $ts_entrada"
    R1="$(req -X POST "$API_BASE/asistencia/marca" \
      -H "$AUTH_HEADER" \
      -H "Content-Type: application/json" \
      -d "{\"identificacion\":\"$IDENTIFICACION\",\"tipo_marca\":\"ENTRADA\",\"timestamp\":\"$ts_entrada\"}")"
    OK1="$(echo "$R1" | jq -r '.success // false')"
    if [ "$OK1" != "true" ]; then
      echo "  Error ENTRADA: $(echo "$R1" | api_msg)"
      current="$(date_add_one "$current")"
      sleep "$SLEEP_SECONDS"
      continue
    fi

    sleep "$SLEEP_SECONDS"

    echo "[$current][$code] SALIDA  $ts_salida"
    R2="$(req -X POST "$API_BASE/asistencia/marca" \
      -H "$AUTH_HEADER" \
      -H "Content-Type: application/json" \
      -d "{\"identificacion\":\"$IDENTIFICACION\",\"tipo_marca\":\"SALIDA\",\"timestamp\":\"$ts_salida\"}")"
    OK2="$(echo "$R2" | jq -r '.success // false')"
    if [ "$OK2" != "true" ]; then
      echo "  Error SALIDA: $(echo "$R2" | api_msg)"
    else
      echo "  OK día $current"
    fi

    sleep "$SLEEP_SECONDS"
  else
    echo "[$current][$code] Día no laboral, se omite."
  fi

  current="$(date_add_one "$current")"
done

echo "Proceso finalizado."