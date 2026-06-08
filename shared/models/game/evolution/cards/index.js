import makeCard from './makeCard';
import * as tt from '../traitTypes/index';
import * as ptt from '../plantarium/plantTraitTypes';

export * from './base';
export * from './ttf';
export * from './cons';
export * from './bonus';
export * from './plantarium';
export * from './customff';
export * from './lifecycle';

export const CardUnknown = {
  type: 'CardUnknown'
};

export const CardCarnivorous = makeCard(tt.TraitCarnivorous);
export const CardParasite = makeCard(tt.TraitParasite);
export const CardCommunication = makeCard(tt.TraitCommunication);
export const CardAquatic = makeCard(ptt.PlantTraitAquatic);

//export const
export const CardCamouflage = makeCard(tt.TraitCamouflage);
export const CardSharpVision = makeCard(tt.TraitSharpVision);

// Magic cards
export const CardMagicShield = makeCard(tt.TraitMagicShield);
export const CardManaBurst = makeCard(tt.TraitManaBurst);
export const CardPhaseShift = makeCard(tt.TraitPhaseShift);
export const CardLifeLeech = makeCard(tt.TraitLifeLeech);
export const CardSoulLink = makeCard(tt.TraitSoulLink);
export const CardArcaneGrowth = makeCard(tt.TraitArcaneGrowth);
export const CardWildTeleport = makeCard(tt.TraitWildTeleport);
export const CardIllusion = makeCard(tt.TraitIllusion);
export const CardCurse = makeCard(tt.TraitCurse);
export const CardBlessing = makeCard(tt.TraitBlessing);
export const CardMirror = makeCard(tt.TraitMirror);
export const CardManaDrain = makeCard(tt.TraitManaDrain);
export const CardPhoenix = makeCard(tt.TraitPhoenix);
export const CardEntropy = makeCard(tt.TraitEntropy);