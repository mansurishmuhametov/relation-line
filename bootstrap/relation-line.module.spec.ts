import { RelationLineModule } from './relation-line.module';

describe('RelationLineModule', () => {
    let relationLineModule: RelationLineModule;

    beforeEach(() => {
        relationLineModule = new RelationLineModule();
    });

    it('should create an instance', () => {
        expect(relationLineModule).toBeTruthy();
    });
});
