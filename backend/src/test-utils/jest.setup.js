if (process.env.TEST_COVERAGE_SILENT_CONSOLE === "1") {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};

  afterAll(() => {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  });
}
