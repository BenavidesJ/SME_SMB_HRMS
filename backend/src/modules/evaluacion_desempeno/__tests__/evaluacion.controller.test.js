import { jest } from "@jest/globals";
import { HTTP_CODES } from "../../../common/strings.js";
import { createHttpMocks } from "../../../test-utils/httpMocks.js";

const crearRubro = jest.fn();
const obtenerRubros = jest.fn();
const eliminarRubro = jest.fn();
const crearEvaluacion = jest.fn();
const obtenerEvaluaciones = jest.fn();
const obtenerEvaluacionPorId = jest.fn();
const finalizarEvaluacion = jest.fn();
const obtenerEvaluacionesColaborador = jest.fn();

jest.unstable_mockModule("../handlers/crearRubro.js", () => ({ crearRubro }));
jest.unstable_mockModule("../handlers/obtenerRubros.js", () => ({ obtenerRubros }));
jest.unstable_mockModule("../handlers/eliminarRubro.js", () => ({ eliminarRubro }));
jest.unstable_mockModule("../handlers/crearEvaluacion.js", () => ({ crearEvaluacion }));
jest.unstable_mockModule("../handlers/obtenerEvaluaciones.js", () => ({ obtenerEvaluaciones }));
jest.unstable_mockModule("../handlers/obtenerEvaluacionPorId.js", () => ({ obtenerEvaluacionPorId }));
jest.unstable_mockModule("../handlers/finalizarEvaluacion.js", () => ({ finalizarEvaluacion }));
jest.unstable_mockModule("../handlers/obtenerEvaluacionesColaborador.js", () => ({ obtenerEvaluacionesColaborador }));

const {
  crearRubroController,
  obtenerRubrosController,
  eliminarRubroController,
  crearEvaluacionController,
  obtenerEvaluacionesController,
  obtenerEvaluacionPorIdController,
  finalizarEvaluacionController,
  obtenerEvaluacionesColaboradorController,
} = await import("../evaluacion.controller.js");

describe("evaluacion_desempeno controllers", () => {
  beforeEach(() => jest.clearAllMocks());

  test("crearRubroController responde CREATED", async () => {
    const { req, res, next } = createHttpMocks({ body: { nombre: "Calidad" } });
    crearRubro.mockResolvedValue({ id: 1 });

    await crearRubroController(req, res, next);

    expect(crearRubro).toHaveBeenCalledWith({ nombre: "Calidad" });
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.CREATED);
    expect(next).not.toHaveBeenCalled();
  });

  test("obtenerRubrosController responde OK", async () => {
    const { req, res, next } = createHttpMocks({});
    obtenerRubros.mockResolvedValue([{ id: 1 }]);

    await obtenerRubrosController(req, res, next);

    expect(obtenerRubros).toHaveBeenCalledWith();
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
    expect(next).not.toHaveBeenCalled();
  });

  test("eliminarRubroController usa params.id", async () => {
    const { req, res, next } = createHttpMocks({});
    req.params = { id: "9" };
    eliminarRubro.mockResolvedValue({ deleted: true });

    await eliminarRubroController(req, res, next);

    expect(eliminarRubro).toHaveBeenCalledWith({ id_rubro_evaluacion: "9" });
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
    expect(next).not.toHaveBeenCalled();
  });

  test("crearEvaluacionController usa body o {}", async () => {
    const { req, res, next } = createHttpMocks({ body: undefined });
    crearEvaluacion.mockResolvedValue({ id: 20 });

    await crearEvaluacionController(req, res, next);

    expect(crearEvaluacion).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.CREATED);
    expect(next).not.toHaveBeenCalled();
  });

  test("obtenerEvaluacionesController mapea query", async () => {
    const { req, res, next } = createHttpMocks({});
    req.query = { id_evaluador: "3", finalizada: "true", departamento: "2" };
    obtenerEvaluaciones.mockResolvedValue([]);

    await obtenerEvaluacionesController(req, res, next);

    expect(obtenerEvaluaciones).toHaveBeenCalledWith({
      id_evaluador: "3",
      finalizada: "true",
      departamento: "2",
    });
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
    expect(next).not.toHaveBeenCalled();
  });

  test("obtenerEvaluacionPorIdController usa params.id", async () => {
    const { req, res, next } = createHttpMocks({});
    req.params = { id: "17" };
    obtenerEvaluacionPorId.mockResolvedValue({ id: 17 });

    await obtenerEvaluacionPorIdController(req, res, next);

    expect(obtenerEvaluacionPorId).toHaveBeenCalledWith({ id_evaluacion: "17" });
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
    expect(next).not.toHaveBeenCalled();
  });

  test("finalizarEvaluacionController mapea params y body", async () => {
    const { req, res, next } = createHttpMocks({ body: { calificaciones: [{ id: 1, nota: 4 }], plan_accion: "Mejorar" } });
    req.params = { id: "31" };
    finalizarEvaluacion.mockResolvedValue({ id: 31, finalizada: true });

    await finalizarEvaluacionController(req, res, next);

    expect(finalizarEvaluacion).toHaveBeenCalledWith({
      id_evaluacion: "31",
      calificaciones: [{ id: 1, nota: 4 }],
      plan_accion: "Mejorar",
    });
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
    expect(next).not.toHaveBeenCalled();
  });

  test("obtenerEvaluacionesColaboradorController usa params.id_colaborador", async () => {
    const { req, res, next } = createHttpMocks({});
    req.params = { id_colaborador: "44" };
    obtenerEvaluacionesColaborador.mockResolvedValue([]);

    await obtenerEvaluacionesColaboradorController(req, res, next);

    expect(obtenerEvaluacionesColaborador).toHaveBeenCalledWith({ id_colaborador: "44" });
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
    expect(next).not.toHaveBeenCalled();
  });

  test("propaga errores por next en todos los controllers", async () => {
    const cases = [
      { controller: crearRubroController, mock: crearRubro, reqData: { body: {} } },
      { controller: obtenerRubrosController, mock: obtenerRubros, reqData: {} },
      { controller: eliminarRubroController, mock: eliminarRubro, reqData: { params: { id: "1" } } },
      { controller: crearEvaluacionController, mock: crearEvaluacion, reqData: { body: {} } },
      { controller: obtenerEvaluacionesController, mock: obtenerEvaluaciones, reqData: { query: {} } },
      { controller: obtenerEvaluacionPorIdController, mock: obtenerEvaluacionPorId, reqData: { params: { id: "1" } } },
      { controller: finalizarEvaluacionController, mock: finalizarEvaluacion, reqData: { params: { id: "1" }, body: {} } },
      { controller: obtenerEvaluacionesColaboradorController, mock: obtenerEvaluacionesColaborador, reqData: { params: { id_colaborador: "1" } } },
    ];

    for (const item of cases) {
      const { req, res, next } = createHttpMocks(item.reqData);
      const error = new Error(`boom-${item.controller.name}`);
      item.mock.mockRejectedValueOnce(error);

      await item.controller(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    }
  });
});
