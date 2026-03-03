import { jest } from "@jest/globals";
import { HTTP_CODES } from "../../../common/strings.js";
import { createHttpMocks } from "../../../test-utils/httpMocks.js";

const createPeriodoPlanilla = jest.fn();
const listPeriodosPlanilla = jest.fn();
const getPeriodoPlanilla = jest.fn();
const updatePeriodoPlanilla = jest.fn();
const deletePeriodoPlanilla = jest.fn();

const simularPlanillaQuincenal = jest.fn();
const generarPlanillaQuincenal = jest.fn();
const recalcularPlanilla = jest.fn();
const obtenerDetallePlanilla = jest.fn();
const eliminarPlanilla = jest.fn();
const editarPlanilla = jest.fn();

jest.unstable_mockModule("../handlers/periodos/createPeriodo.js", () => ({ createPeriodoPlanilla }));
jest.unstable_mockModule("../handlers/periodos/listPeriodos.js", () => ({ listPeriodosPlanilla }));
jest.unstable_mockModule("../handlers/periodos/getPeriodo.js", () => ({ getPeriodoPlanilla }));
jest.unstable_mockModule("../handlers/periodos/updatePeriodo.js", () => ({ updatePeriodoPlanilla }));
jest.unstable_mockModule("../handlers/periodos/deletePeriodo.js", () => ({ deletePeriodoPlanilla }));

jest.unstable_mockModule("../handlers/payroll/simularPlanilla.js", () => ({ simularPlanillaQuincenal }));
jest.unstable_mockModule("../handlers/payroll/generatePayroll.js", () => ({ generarPlanillaQuincenal }));
jest.unstable_mockModule("../handlers/payroll/recalcularPlanilla.js", () => ({ recalcularPlanilla }));
jest.unstable_mockModule("../handlers/payroll/getPayrollDetails.js", () => ({ obtenerDetallePlanilla }));
jest.unstable_mockModule("../handlers/payroll/deletePlanilla.js", () => ({ eliminarPlanilla }));
jest.unstable_mockModule("../handlers/payroll/editPlanilla.js", () => ({ editarPlanilla }));

const {
  createPeriodoPlanillaController,
  listPeriodosPlanillaController,
  getPeriodoPlanillaController,
  updatePeriodoPlanillaController,
  deletePeriodoPlanillaController,
  simularPlanillaController,
  generarPlanillaController,
  recalcularPlanillaController,
  obtenerDetallePlanillaController,
  eliminarPlanillaController,
  editarPlanillaController,
} = await import("../planillas.controller.js");

describe("planillas controllers", () => {
  beforeEach(() => jest.clearAllMocks());

  test("createPeriodoPlanillaController responde CREATED", async () => {
    const { req, res, next } = createHttpMocks({ body: { anio: 2026 } });
    createPeriodoPlanilla.mockResolvedValue({ id: 1 });

    await createPeriodoPlanillaController(req, res, next);

    expect(createPeriodoPlanilla).toHaveBeenCalledWith({ anio: 2026 });
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.CREATED);
    expect(next).not.toHaveBeenCalled();
  });

  test("listPeriodosPlanillaController responde OK", async () => {
    const { req, res, next } = createHttpMocks({});
    listPeriodosPlanilla.mockResolvedValue([{ id: 1 }]);

    await listPeriodosPlanillaController(req, res, next);

    expect(listPeriodosPlanilla).toHaveBeenCalledWith();
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
    expect(next).not.toHaveBeenCalled();
  });

  test("getPeriodoPlanillaController usa params.id", async () => {
    const { req, res, next } = createHttpMocks({});
    req.params = { id: "11" };
    getPeriodoPlanilla.mockResolvedValue({ id: 11 });

    await getPeriodoPlanillaController(req, res, next);

    expect(getPeriodoPlanilla).toHaveBeenCalledWith({ id: "11" });
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
    expect(next).not.toHaveBeenCalled();
  });

  test("updatePeriodoPlanillaController usa id y patch", async () => {
    const { req, res, next } = createHttpMocks({ body: { cerrado: true } });
    req.params = { id: "15" };
    updatePeriodoPlanilla.mockResolvedValue({ id: 15 });

    await updatePeriodoPlanillaController(req, res, next);

    expect(updatePeriodoPlanilla).toHaveBeenCalledWith({ id: "15", patch: { cerrado: true } });
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
    expect(next).not.toHaveBeenCalled();
  });

  test("deletePeriodoPlanillaController usa id", async () => {
    const { req, res, next } = createHttpMocks({});
    req.params = { id: "7" };
    deletePeriodoPlanilla.mockResolvedValue({ deleted: true });

    await deletePeriodoPlanillaController(req, res, next);

    expect(deletePeriodoPlanilla).toHaveBeenCalledWith({ id: "7" });
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
    expect(next).not.toHaveBeenCalled();
  });

  test("simularPlanillaController usa body o {}", async () => {
    const { req, res, next } = createHttpMocks({ body: undefined });
    simularPlanillaQuincenal.mockResolvedValue({ total: 1 });

    await simularPlanillaController(req, res, next);

    expect(simularPlanillaQuincenal).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
    expect(next).not.toHaveBeenCalled();
  });

  test("generarPlanillaController responde CREATED", async () => {
    const { req, res, next } = createHttpMocks({ body: { id_periodo_planilla: 3 } });
    generarPlanillaQuincenal.mockResolvedValue({ id_planilla: 9 });

    await generarPlanillaController(req, res, next);

    expect(generarPlanillaQuincenal).toHaveBeenCalledWith({ id_periodo_planilla: 3 });
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.CREATED);
    expect(next).not.toHaveBeenCalled();
  });

  test("recalcularPlanillaController responde OK", async () => {
    const { req, res, next } = createHttpMocks({ body: { id_planilla: 5 } });
    recalcularPlanilla.mockResolvedValue({ id_planilla: 5 });

    await recalcularPlanillaController(req, res, next);

    expect(recalcularPlanilla).toHaveBeenCalledWith({ id_planilla: 5 });
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
    expect(next).not.toHaveBeenCalled();
  });

  test("obtenerDetallePlanillaController responde OK", async () => {
    const { req, res, next } = createHttpMocks({ body: { id_planilla: 5 } });
    obtenerDetallePlanilla.mockResolvedValue({ rows: [] });

    await obtenerDetallePlanillaController(req, res, next);

    expect(obtenerDetallePlanilla).toHaveBeenCalledWith({ id_planilla: 5 });
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
    expect(next).not.toHaveBeenCalled();
  });

  test("eliminarPlanillaController parsea id a number", async () => {
    const { req, res, next } = createHttpMocks({});
    req.params = { id: "22" };
    eliminarPlanilla.mockResolvedValue({ deleted: true });

    await eliminarPlanillaController(req, res, next);

    expect(eliminarPlanilla).toHaveBeenCalledWith({ id_detalle: 22 });
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
    expect(next).not.toHaveBeenCalled();
  });

  test("editarPlanillaController usa defaults de body", async () => {
    const { req, res, next } = createHttpMocks({ body: undefined });
    req.params = { id: "10" };
    editarPlanilla.mockResolvedValue({ id_detalle: 10 });

    await editarPlanillaController(req, res, next);

    expect(editarPlanilla).toHaveBeenCalledWith({
      id_detalle: 10,
      datos: {},
      recalcular_deducciones: false,
    });
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
    expect(next).not.toHaveBeenCalled();
  });

  test("propaga errores por next en todos los controllers", async () => {
    const cases = [
      { controller: createPeriodoPlanillaController, mock: createPeriodoPlanilla, reqData: { body: {} } },
      { controller: listPeriodosPlanillaController, mock: listPeriodosPlanilla, reqData: {} },
      { controller: getPeriodoPlanillaController, mock: getPeriodoPlanilla, reqData: { params: { id: "1" } } },
      { controller: updatePeriodoPlanillaController, mock: updatePeriodoPlanilla, reqData: { params: { id: "1" }, body: {} } },
      { controller: deletePeriodoPlanillaController, mock: deletePeriodoPlanilla, reqData: { params: { id: "1" } } },
      { controller: simularPlanillaController, mock: simularPlanillaQuincenal, reqData: { body: {} } },
      { controller: generarPlanillaController, mock: generarPlanillaQuincenal, reqData: { body: {} } },
      { controller: recalcularPlanillaController, mock: recalcularPlanilla, reqData: { body: {} } },
      { controller: obtenerDetallePlanillaController, mock: obtenerDetallePlanilla, reqData: { body: {} } },
      { controller: eliminarPlanillaController, mock: eliminarPlanilla, reqData: { params: { id: "1" } } },
      { controller: editarPlanillaController, mock: editarPlanilla, reqData: { params: { id: "1" }, body: {} } },
    ];

    for (const item of cases) {
      const { req, res, next } = createHttpMocks(item.reqData);
      if (item.reqData?.params) req.params = item.reqData.params;
      if (item.reqData?.query) req.query = item.reqData.query;
      if (Object.prototype.hasOwnProperty.call(item.reqData ?? {}, "body")) req.body = item.reqData.body;
      const error = new Error(`boom-${item.controller.name}`);
      item.mock.mockRejectedValueOnce(error);

      await item.controller(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    }
  });
});
