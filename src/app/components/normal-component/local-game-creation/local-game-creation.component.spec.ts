import { fakeAsync } from '@angular/core/testing';
import { SimpleComponentTestUtils } from 'src/app/utils/tests/TestUtils.spec';
import { LocalGameCreationComponent } from './local-game-creation.component';

describe('LocalGameCreationComponent', () => {
    let testUtils: SimpleComponentTestUtils<LocalGameCreationComponent>;

    beforeEach(async() => {
        testUtils = await SimpleComponentTestUtils.create(LocalGameCreationComponent);
        testUtils.detectChanges();
    });
    it('should create and redirect to chosen game', fakeAsync(async() => {
        testUtils.getComponent().pickGame('whateverGame');
        spyOn(testUtils.getComponent().router, 'navigate');
        expect(await testUtils.clickElement('#playLocally')).toBeTrue();
        expect(testUtils.getComponent().router.navigate).toHaveBeenCalledOnceWith(['local/whateverGame']);
    }));
});
