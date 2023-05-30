import { Batch, BatchEnvironmentEnum } from '@mparticle/event-models';
import BatchManager, {
    IMpApiClientImplementation,
} from '../../../src/NextGen/batchManager';
import { BaseMPMessage } from '../../../src/NextGen/core/baseMPMessage';

describe('Next Gen', () => {
    describe('Batch Manager', () => {
        describe('#createBatch', () => {
            it('returns a batch', () => {
                const sampleMessages: BaseMPMessage[] = [
                    { name: 'test-message-1' },
                    { name: 'test-message-2' },
                    { name: 'test-message-3' },
                ];
                const expectedBatch: Batch = {
                    environment: BatchEnvironmentEnum.unknown,
                    mpid: 'test-mpid',
                    events: (sampleMessages as unknown) as BaseEvent[],
                };

                const mockApiClient: IMpApiClientImplementation = {
                    uploadBatch: (): void => {},
                };
                const batchMan = new BatchManager(mockApiClient);

                expect(batchMan.createBatch(sampleMessages)).toEqual(
                    expectedBatch
                );
            });

            it('returns null if there is no batch to create', () => {
                const mockApiClient: IMpApiClientImplementation = {
                    uploadBatch: (): void => {},
                };
                const batchMan = new BatchManager(mockApiClient);

                expect(batchMan.createBatch(null)).toBeNull();
            });
        });

        describe('#uploadBatch', () => {
            it('should upload a batch via the api client', () => {
                const batch: Batch = {
                    environment: BatchEnvironmentEnum.development,
                    mpid: 'test-mpid',
                };

                const mockApiClient: IMpApiClientImplementation = {
                    uploadBatch: (): void => {},
                };

                const uploadSpy = jest.spyOn(mockApiClient, 'uploadBatch');

                const batchMan = new BatchManager(mockApiClient);
                batchMan.uploadBatch(batch);
                expect(uploadSpy).toHaveBeenCalledWith(batch);
            });
        });
    });
});
