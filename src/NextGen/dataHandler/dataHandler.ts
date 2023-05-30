import { IMParticleComponent } from '../core/component';

export interface IMParticleDataHandler extends IMParticleComponent {
    // QUESTION: Shouldn't we be passing in a type for data instead of being "any"?
    // QUESTION: Shouldn't immediateUpload be optional?
    saveData(data: any, immediateUpload: boolean);
    configure(): void;
}
