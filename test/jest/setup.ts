// Jest setup file to mock performance API before mParticle loads
const mockPerformanceMark = jest.fn();

// Extend jsdom's performance object with mark function
if (globalThis.performance) {
    globalThis.performance.mark = mockPerformanceMark;
} else {
    globalThis.performance = {
        mark: mockPerformanceMark,
    } as any;
}

// Make the mock available globally for tests
globalThis.__mockPerformanceMark = mockPerformanceMark;
