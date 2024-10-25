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

        it('should throw an error if it cannot compute the proper mParticle function', () => {
            const readyQueue = [['Identity.login']];
            expect(() => processReadyQueue(readyQueue)).toThrowError("Unable to compute proper mParticle function TypeError: Cannot read properties of undefined (reading 'login')");
        });
    });
});