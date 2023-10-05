import _BatchValidator from '../../src/mockBatchCreator';

const batchValidator = new _BatchValidator();

// Create sample batches for testing
export const batch1 = batchValidator.returnBatch([
    {
        messageType: 4,
        name: 'Test Event 1',
    },
    {
        messageType: 4,
        name: 'Test Event 2',
    },
]);

export const batch2 = batchValidator.returnBatch([
    {
        messageType: 4,
        name: 'Test Event 3',
    },
    {
        messageType: 4,
        name: 'Test Event 4',
    },
]);

export const batch3 = batchValidator.returnBatch([
    {
        messageType: 4,
        name: 'Test Event 5',
    },
    {
        messageType: 4,
        name: 'Test Event 6',
    },
]);
