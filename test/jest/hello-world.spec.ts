import theAnswerToLifeTheUniverseAndEverything from "./theAnswer";

describe('JEST Hello World', () => {
    it('The answer to life, the universe and everything', () => {
        expect(theAnswerToLifeTheUniverseAndEverything()).toEqual('42');
    });
});
