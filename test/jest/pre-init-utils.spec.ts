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

        it('should not throw when it cannot compute the proper mParticle function', () => {
            // processPreloadedItem still throws, but processReadyQueue catches
            // per item so a bad entry cannot abort the drain.
            const readyQueue = [['Identity.login']];
            expect(() => processReadyQueue(readyQueue)).not.toThrow();
            expect(readyQueue).toEqual([]);
        });

        it('should continue processing siblings after an item throws', () => {
            const afterSpy = jest.fn();
            const loggerError = jest.fn();
            (window.mParticle as any) = {
                getInstance: () => ({ Logger: { error: loggerError } }),
                afterMethod: afterSpy,
            };

            const readyQueue = [
                ['Identity.login'], // unresolved → throws inside processPreloadedItem
                ['afterMethod', 'kept'],
            ];

            expect(() => processReadyQueue(readyQueue)).not.toThrow();
            expect(afterSpy).toHaveBeenCalledTimes(1);
            expect(afterSpy).toHaveBeenCalledWith('kept');
            expect(readyQueue).toEqual([]);
            expect(loggerError).toHaveBeenCalledWith(
                expect.stringContaining(
                    'Error processing ready queue item: Unable to compute proper mParticle function'
                )
            );
        });

        it('should continue after a queued function throws', () => {
            const afterSpy = jest.fn();
            const loggerError = jest.fn();
            (window.mParticle as any) = {
                getInstance: () => ({ Logger: { error: loggerError } }),
            };

            processReadyQueue([
                () => {
                    throw new Error('callback blew up');
                },
                afterSpy,
            ]);

            expect(afterSpy).toHaveBeenCalledTimes(1);
            expect(loggerError).toHaveBeenCalledWith(
                'Error processing ready queue item: callback blew up'
            );
        });

        it('should not mutate the queued item array itself', () => {
            const functionSpy = jest.fn();
            (window.mParticle as any) = {
                fakeFunction: functionSpy,
            };
            const item = ['fakeFunction', 'foo'];

            processReadyQueue([item]);
            // Item-level copy keeps the call shape intact even though the
            // containing queue is drained.
            expect(item).toEqual(['fakeFunction', 'foo']);
            expect(functionSpy).toHaveBeenCalledTimes(1);
            expect(functionSpy).toHaveBeenCalledWith('foo');
        });

        it('should empty the shared queue so a second drain is a no-op', () => {
            const functionSpy = jest.fn();
            (window.mParticle as any) = {
                fakeFunction: functionSpy,
            };
            const readyQueue = [['fakeFunction', 'foo']];

            expect(() => {
                processReadyQueue(readyQueue);
                processReadyQueue(readyQueue);
            }).not.toThrow();
            expect(readyQueue).toEqual([]);
            expect(functionSpy).toHaveBeenCalledTimes(1);
        });

        it('should not re-execute items when processReadyQueue re-enters on the same array', () => {
            // Symptom this guards against (pre drain-first fix):
            //   readyQueue = [login-like, logEvent-like]
            //   outer drain runs item[0] → sync parseIdentityResponse re-enters
            //   processReadyQueue on the SAME array → item[0] and item[1] run
            //   again, then outer continues and runs item[1] again.
            // Observed: each queued method fires twice (4 spy calls below).
            // With drain-first: nested call sees [], each method fires once.
            const functionSpy = jest.fn();
            const readyQueue: any[] = [];
            let hasReentered = false;

            (window.mParticle as any) = {
                fakeFunction: (...args: any[]) => {
                    functionSpy(...args);
                    // One-shot re-entry mimics a single cache-hit identity
                    // completing mid-drain. Without the guard this would
                    // recurse forever; with it we get a clear 4-vs-2 assertion.
                    if (!hasReentered) {
                        hasReentered = true;
                        processReadyQueue(readyQueue);
                    }
                },
            };

            readyQueue.push(
                ['fakeFunction', 'first'],
                ['fakeFunction', 'second']
            );

            processReadyQueue(readyQueue);

            // Primary symptom: without drain-first this is 4 (each item twice).
            expect(functionSpy).toHaveBeenCalledTimes(2);
            expect(functionSpy).toHaveBeenNthCalledWith(1, 'first');
            expect(functionSpy).toHaveBeenNthCalledWith(2, 'second');
            expect(readyQueue).toEqual([]);
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