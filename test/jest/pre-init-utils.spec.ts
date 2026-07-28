import { processReadyQueue } from '../../src/pre-init-utils';

describe('pre-init-utils', () => {
    describe('#processReadyQueue', () => {
        it('should return an empty array if readyQueue is empty', () => {
            const result = processReadyQueue([]);
            expect(result).toEqual([]);
        });

        it('should process functions passed as arguments', () => {
            const functionSpy = jest.fn();
            const readyQueue: Function[] = [functionSpy, functionSpy, functionSpy];
            const result = processReadyQueue(readyQueue);
            expect(functionSpy).toHaveBeenCalledTimes(3);
            expect(result).toEqual([]);
        });

        it('should process mixed queue with both functions and arrays', () => {
            const functionSpy = jest.fn();
            const arraySpy = jest.fn();
            (window.mParticle as any) = {
                arrayMethod: arraySpy,
            };
            
            const readyQueue = [
                functionSpy,
                ['arrayMethod', 'arg1'],
                functionSpy,
            ];
            
            processReadyQueue(readyQueue);
            
            expect(functionSpy).toHaveBeenCalledTimes(2);
            expect(arraySpy).toHaveBeenCalledWith('arg1');
        });

        it('should process functions passed as arrays', () => {
            const functionSpy = jest.fn();
            (window.mParticle as any) = {
                fakeFunction: functionSpy,
            };
            const readyQueue = [['fakeFunction']];
            processReadyQueue(readyQueue);
            expect(functionSpy).toHaveBeenCalled();
        });

        it('should process functions passed as arrays with arguments', () => {
            const functionSpy = jest.fn();
            (window.mParticle as any) = {
                fakeFunction: functionSpy,
                args: () => {},
            };
            const readyQueue = [['fakeFunction', 'args']];
            processReadyQueue(readyQueue);
            expect(functionSpy).toHaveBeenCalledWith('args');
        });

        it('should process arrays passed as arguments with multiple methods', () => {
            const functionSpy = jest.fn();
            (window.mParticle as any) = {
                fakeFunction: {
                    anotherFakeFunction: functionSpy,
                },
            };
            const readyQueue = [['fakeFunction.anotherFakeFunction', 'foo']];
            processReadyQueue(readyQueue);
            expect(functionSpy).toHaveBeenCalledWith('foo');
        });

        it('should process arrays passed as arguments with multiple methods and arguments', () => {
            const functionSpy = jest.fn();
            const functionSpy2 = jest.fn();
            (window.mParticle as any) = {
                fakeFunction: functionSpy,
                anotherFakeFunction: functionSpy2,
            };
            const readyQueue = [['fakeFunction', 'foo'], ['anotherFakeFunction', 'bar']];
            processReadyQueue(readyQueue);
            expect(functionSpy).toHaveBeenCalledWith('foo');
            expect(functionSpy2).toHaveBeenCalledWith('bar');
        });

        it('should throw an error if it cannot compute the proper mParticle function', () => {
            const readyQueue = [['Identity.login']];
            expect(() => processReadyQueue(readyQueue)).toThrowError(
                'Unable to compute proper mParticle function - method not found'
            );
        });

        it('should name the unresolved method path on the error stack', () => {
            // The path travels on `stack` rather than `message` so the message
            // stays low-cardinality for monitors while the path remains
            // queryable via the reporting pipeline's stackTrace field.
            (window.mParticle as any) = {};

            let caught: Error | null = null;
            try {
                processReadyQueue([['Identity.login']]);
            } catch (e) {
                caught = e as Error;
            }

            expect(caught).not.toBeNull();
            expect(caught!.message).toBe(
                'Unable to compute proper mParticle function - method not found'
            );
            expect(caught!.stack).toContain(
                'mParticle pre-init method not found: Identity.login'
            );
        });

        it('should distinguish a resolved method that throws from an unresolved one', () => {
            (window.mParticle as any) = {
                Identity: {
                    login: () => {
                        throw new Error('login blew up');
                    },
                },
            };

            expect(() => processReadyQueue([['Identity.login']])).toThrowError(
                'Unable to compute proper mParticle function Error: login blew up'
            );
        });

        it('should treat a resolved non-function property as unresolved', () => {
            (window.mParticle as any) = { Identity: { login: 'not-a-function' } };

            expect(() => processReadyQueue([['Identity.login']])).toThrowError(
                'Unable to compute proper mParticle function - method not found'
            );
        });

        it('should not mutate the queued item so it can be processed again', () => {
            const functionSpy = jest.fn();
            (window.mParticle as any) = {
                fakeFunction: functionSpy,
            };
            const item = ['fakeFunction', 'foo'];

            processReadyQueue([item]);
            // The item must be left intact — a second drain must not see a stripped array.
            expect(item).toEqual(['fakeFunction', 'foo']);

            processReadyQueue([item]);
            expect(functionSpy).toHaveBeenCalledTimes(2);
            expect(functionSpy).toHaveBeenNthCalledWith(1, 'foo');
            expect(functionSpy).toHaveBeenNthCalledWith(2, 'foo');
        });

        it('should not throw when the same queue is drained more than once (re-entrancy safe)', () => {
            const functionSpy = jest.fn();
            (window.mParticle as any) = {
                fakeFunction: functionSpy,
            };
            const readyQueue = [['fakeFunction', 'foo']];

            expect(() => {
                processReadyQueue(readyQueue);
                processReadyQueue(readyQueue);
            }).not.toThrow();
            expect(functionSpy).toHaveBeenCalledTimes(2);
        });

        it('should skip malformed queue items instead of throwing', () => {
            (window.mParticle as any) = {};
            // empty array -> method undefined; non-string method -> method.split would throw
            expect(() => processReadyQueue([[]])).not.toThrow();
            expect(() => processReadyQueue([[{} as any, 'arg']])).not.toThrow();
            expect(() => processReadyQueue([[42 as any]])).not.toThrow();
        });
    });
});