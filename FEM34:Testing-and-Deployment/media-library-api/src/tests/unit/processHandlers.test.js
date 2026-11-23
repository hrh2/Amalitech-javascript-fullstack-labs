const { EventEmitter } = require('node:events');
const logger = require('../../utils/logger');
const { registerProcessHandlers, createShutdown } = require('../../utils/processHandlers');

describe('registerProcessHandlers', () => {
  let errorSpy;
  beforeEach(() => { errorSpy = jest.spyOn(logger, 'error'); });
  afterEach(() => errorSpy.mockRestore());

  test('an unhandled promise rejection is logged at error level and triggers shutdown(1)', () => {
    const proc = new EventEmitter();
    const shutdown = jest.fn();
    registerProcessHandlers({ proc, shutdown });
    proc.emit('unhandledRejection', new Error('nobody awaited me'));
    expect(errorSpy).toHaveBeenCalledWith('Unhandled promise rejection. Shutting down.', expect.objectContaining({ error: 'nobody awaited me' }));
    expect(shutdown).toHaveBeenCalledWith(1);
  });

  test('an uncaught exception is logged at error level and triggers shutdown(1)', () => {
    const proc = new EventEmitter();
    const shutdown = jest.fn();
    registerProcessHandlers({ proc, shutdown });
    proc.emit('uncaughtException', new Error('oops'));
    expect(errorSpy).toHaveBeenCalledWith('Uncaught exception. Shutting down.', expect.objectContaining({ error: 'oops' }));
    expect(shutdown).toHaveBeenCalledWith(1);
  });

  test('SIGTERM and SIGINT shut down normally (code 0)', () => {
    const proc = new EventEmitter();
    const shutdown = jest.fn();
    registerProcessHandlers({ proc, shutdown });
    proc.emit('SIGTERM');
    proc.emit('SIGINT');
    expect(shutdown.mock.calls).toEqual([[0], [0]]);
  });
});

describe('createShutdown', () => {
  test('closes the server, then the database, then exits; a second call does nothing', async () => {
    const order = [];
    const server = { close: (cb) => { order.push('server closed'); cb(); } };
    const shutdown = createShutdown({ getServer: () => server, disconnect: async () => order.push('db closed'), exit: (code) => order.push(`exit ${code}`) });
    await shutdown(1);
    await shutdown(1);
    expect(order).toEqual(['server closed', 'db closed', 'exit 1']);
  });

  test('works before the server exists (a failure during start-up)', async () => {
    const exit = jest.fn();
    await createShutdown({ getServer: () => undefined, disconnect: async () => {}, exit })(1);
    expect(exit).toHaveBeenCalledWith(1);
  });

  test('exits with code 1 when closing fails', async () => {
    const exit = jest.fn();
    const errorSpy = jest.spyOn(logger, 'error');
    await createShutdown({ getServer: () => null, disconnect: async () => { throw new Error('x'); }, exit })(0);
    expect(exit).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('Error during shutdown', expect.any(Object));
    errorSpy.mockRestore();
  });
});
