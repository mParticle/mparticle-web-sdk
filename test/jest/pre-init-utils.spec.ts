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
            expect(() => processReadyQueue(readyQueue)).toThrowError("Unable to compute proper mParticle function TypeError: Cannot read properties of undefined (reading 'login')");
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
            const functionSpy = jest.fn();
            const readyQueue: any[] = [];

            (window.mParticle as any) = {
                // Mimic cache-hit identify: executing a queued method re-enters
                // processReadyQueue on the shared ready-queue array before the
                // outer call has returned / been reassigned.
                fakeFunction: (...args: any[]) => {
                    functionSpy(...args);
                    processReadyQueue(readyQueue);
                },
            };

            readyQueue.push(
                ['fakeFunction', 'first'],
                ['fakeFunction', 'second']
            );

            processReadyQueue(readyQueue);

            expect(readyQueue).toEqual([]);
            // Drain-first ensures the nested call sees an empty queue. Without
            // it, the nested call would re-run remaining (or all) items and
            // recurse via fakeFunction.
            expect(functionSpy).toHaveBeenCalledTimes(2);
            expect(functionSpy).toHaveBeenNthCalledWith(1, 'first');
            expect(functionSpy).toHaveBeenNthCalledWith(2, 'second');
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