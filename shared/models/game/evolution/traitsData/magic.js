import {fromJS} from 'immutable';
import {
  TRAIT_TARGET_TYPE,
  TRAIT_COOLDOWN_PLACE,
  TRAIT_COOLDOWN_DURATION,
  CARD_TARGET_TYPE,
  TRAIT_ANIMAL_FLAG
} from '../constants';

import ERRORS from '../../../../actions/errors';

import {
  server$startFeeding,
  server$traitStartCooldown,
  server$traitSetAnimalFlag,
  server$traitSetValue,
  server$traitAnimalRemoveTrait,
  server$traitNotify_End,
  server$traitActivate,
  server$traitTeleport,
} from '../../../../actions/actions';

import {getIntRandom} from '../../../../utils/randomGenerator';
import * as tt from '../traitTypes';

// Магические трейты — набор из 15 уникальных свойств и их взаимодействий

export const TraitMagicShield = {
  type: tt.TraitMagicShield,
  playerControllable: true,
  targetType: TRAIT_TARGET_TYPE.NONE,
  cooldowns: fromJS([[tt.TraitMagicShield, TRAIT_COOLDOWN_PLACE.TRAIT, TRAIT_COOLDOWN_DURATION.ROUND]]),
  _getErrorOfUse: (game, animal) => {
    if (animal.hasFlag(TRAIT_ANIMAL_FLAG.MAGIC_SHIELD)) return ERRORS.TRAIT_ACTION_NO_VALUE;
    return false;
  },
  action: (game, animal, trait) => (dispatch) => {
    dispatch(server$traitStartCooldown(game.id, trait, animal));
    dispatch(server$traitSetAnimalFlag(game, animal, TRAIT_ANIMAL_FLAG.MAGIC_SHIELD, true));
    return true;
  },
  customFns: {
    onRemove: (game, animal) => (dispatch) => {
      dispatch(server$traitSetAnimalFlag(game, animal, TRAIT_ANIMAL_FLAG.MAGIC_SHIELD, false));
    }
  }
};

export const TraitManaBurst = {
  type: tt.TraitManaBurst,
  playerControllable: true,
  targetType: TRAIT_TARGET_TYPE.NONE,
  cooldowns: fromJS([[tt.TraitManaBurst, TRAIT_COOLDOWN_PLACE.TRAIT, TRAIT_COOLDOWN_DURATION.ACTIVATION]]),
  _getErrorOfUse: (game, animal) => {
    if (animal.isFull && animal.isFull(game)) return ERRORS.ANIMAL_DONT_WANT_FOOD;
    return false;
  },
  action: (game, animal, trait) => (dispatch) => {
    dispatch(server$traitStartCooldown(game.id, trait, animal));
    dispatch(server$startFeeding(game.id, animal.id, 2, tt.TraitManaBurst));
    dispatch(server$traitNotify_End(game.id, animal.id, trait));
    return true;
  }
};

export const TraitPhaseShift = {
  type: tt.TraitPhaseShift,
  defense: true,
  targetType: TRAIT_TARGET_TYPE.NONE,
  cooldowns: fromJS([[tt.TraitPhaseShift, TRAIT_COOLDOWN_PLACE.TRAIT, TRAIT_COOLDOWN_DURATION.TURN]]),
  action: (game, animal, trait) => (dispatch) => {
    dispatch(server$traitStartCooldown(game.id, trait, animal));
    dispatch(server$traitSetAnimalFlag(game, animal, TRAIT_ANIMAL_FLAG.PHASED, true));
    return true;
  },
  customFns: {
    onRemove: (game, animal) => (dispatch) => {
      dispatch(server$traitSetAnimalFlag(game, animal, TRAIT_ANIMAL_FLAG.PHASED, false));
    }
  }
};

export const TraitLifeLeech = {
  type: tt.TraitLifeLeech,
  targetType: TRAIT_TARGET_TYPE.ANIMAL,
  playerControllable: true,
  cooldowns: fromJS([[tt.TraitLifeLeech, TRAIT_COOLDOWN_PLACE.TRAIT, TRAIT_COOLDOWN_DURATION.TURN]]),
  _getErrorOfUse: (game, sourceAnimal) => {
    if (!sourceAnimal.canEat(game)) return ERRORS.ANIMAL_DONT_WANT_FOOD;
    return false;
  },
  getErrorOfUseOnTarget: (game, sourceAnimal, targetAnimal) => {
    if (targetAnimal.food === 0) return ERRORS.TRAIT_TARGETING_ANIMAL_NO_FOOD;
    return false;
  },
  action: (game, sourceAnimal, trait, targetAnimal) => (dispatch) => {
    dispatch(server$traitStartCooldown(game.id, trait, sourceAnimal));
    dispatch(server$startFeeding(game.id, sourceAnimal.id, 1, tt.TraitLifeLeech, targetAnimal.id));
    dispatch(server$traitNotify_End(game.id, sourceAnimal.id, trait, targetAnimal.id));
    return true;
  }
};

export const TraitSoulLink = {
  type: tt.TraitSoulLink,
  cardTargetType: CARD_TARGET_TYPE.ANIMAL_SELF,
  linkTargetType: CARD_TARGET_TYPE.ANIMAL_SELF,
  playerControllable: true,
  // value: {autoShare: boolean} stored in trait.value
  _getErrorOfUse: (game, animal, trait) => {
    const linked = trait.findLinkedAnimal(game, animal);
    if (!linked) return ERRORS.TRAIT_ACTION_NO_TARGETS;
    return false;
  },
  action: (game, animal, trait) => (dispatch) => {
    // share 1 food from source to linked animal
    const linked = trait.findLinkedAnimal(game, animal);
    if (!linked) return false;
    dispatch(server$traitStartCooldown(game.id, trait, animal));
    dispatch(server$startFeeding(game.id, linked.id, 1, tt.TraitSoulLink, animal.id));
    dispatch(server$traitNotify_End(game.id, animal.id, trait, linked.id));
    return true;
  }
};

export const TraitArcaneGrowth = {
  type: tt.TraitArcaneGrowth,
  // passive: each round grants +1 food (recalculated via customFns)
  customFns: {
    eventRoundEnd: (game, trait, animal) => (dispatch) => {
      // only apply if magic addon enabled in settings
      if (game.settings && game.settings.addon_magic) {
        dispatch(server$startFeeding(game.id, animal.id, 1, tt.TraitArcaneGrowth));
      }
    }
  }
};

export const TraitWildTeleport = {
  type: tt.TraitWildTeleport,
  playerControllable: true,
  targetType: TRAIT_TARGET_TYPE.NONE,
  cooldowns: fromJS([[tt.TraitWildTeleport, TRAIT_COOLDOWN_PLACE.TRAIT, TRAIT_COOLDOWN_DURATION.TWO_TURNS]]),
  action: (game, animal, trait) => (dispatch) => {
    // teleport effect: pick random position in owner's continent and move animal
    dispatch(server$traitStartCooldown(game.id, trait, animal));
    const size = game.getPlayer(animal.ownerId).continent.size;
    const position = Math.max(0, Math.min(size - 1, getIntRandom(0, Math.max(0, size - 1))));
    dispatch(server$traitTeleport(game, animal, position));
    return true;
  },
  customFns: {
    eventNextPlayer: (trait) => trait.set('value', false)
  }
};

export const TraitIllusion = {
  type: tt.TraitIllusion,
  defense: true,
  targetType: TRAIT_TARGET_TYPE.ANIMAL,
  cooldowns: fromJS([[tt.TraitIllusion, TRAIT_COOLDOWN_PLACE.TRAIT, TRAIT_COOLDOWN_DURATION.TURN]]),
  getErrorOfUseOnTarget: (game, illusionAnimal, targetAnimal) => {
    if (targetAnimal.id === illusionAnimal.id) return ERRORS.TRAIT_TARGETING_SAME_ANIMAL;
    return false;
  },
  getTargets: (game, illusionAnimal, trait, attackAnimal, attackTrait) => {
    return game.getPlayer(illusionAnimal.ownerId).continent.filter(a => a.id !== illusionAnimal.id).toList();
  },
  action: (game, illusionAnimal, trait, targetAnimal, attackAnimal, attackTrait) => (dispatch) => {
    dispatch(server$traitStartCooldown(game.id, trait, illusionAnimal));
    // redirect attack to targetAnimal by activating attackTrait with new target
    if (attackAnimal && attackTrait) {
      dispatch(server$traitActivate(game.id, attackAnimal.id, attackTrait, targetAnimal));
    }
    return false;
  }
};

export const TraitCurse = {
  type: tt.TraitCurse,
  targetType: TRAIT_TARGET_TYPE.ANIMAL,
  playerControllable: true,
  cooldowns: fromJS([[tt.TraitCurse, TRAIT_COOLDOWN_PLACE.TRAIT, TRAIT_COOLDOWN_DURATION.ROUND]]),
  getErrorOfUseOnTarget: (game, sourceAnimal, targetAnimal) => {
    if (targetAnimal.id === sourceAnimal.id) return ERRORS.TRAIT_TARGETING_SAME_ANIMAL;
    return false;
  },
  action: (game, sourceAnimal, trait, targetAnimal) => (dispatch) => {
    dispatch(server$traitStartCooldown(game.id, trait, sourceAnimal));
    dispatch(server$traitSetAnimalFlag(game, targetAnimal, TRAIT_ANIMAL_FLAG.CURSED, true));
    return true;
  },
  customFns: {
    onRemove: (game, animal) => (dispatch) => {
      dispatch(server$traitSetAnimalFlag(game, animal, TRAIT_ANIMAL_FLAG.CURSED, false));
    }
  }
};

export const TraitBlessing = {
  type: tt.TraitBlessing,
  cardTargetType: CARD_TARGET_TYPE.ANIMAL_SELF,
  linkTargetType: CARD_TARGET_TYPE.ANIMAL_SELF,
  playerControllable: true,
  cooldowns: fromJS([[tt.TraitBlessing, TRAIT_COOLDOWN_PLACE.TRAIT, TRAIT_COOLDOWN_DURATION.ROUND]]),
  _getErrorOfUse: (game, animal, trait) => {
    const linked = trait.findLinkedAnimal(game, animal);
    if (!linked) return ERRORS.TRAIT_ACTION_NO_TARGETS;
    return false;
  },
  action: (game, animal, trait) => (dispatch) => {
    const linked = trait.findLinkedAnimal(game, animal);
    if (!linked) return false;
    dispatch(server$traitStartCooldown(game.id, trait, animal));
    // set a value so that next time linked eats it will auto-share +1 — game engine should check trait.value
    dispatch(server$traitSetValue(game, linked, trait, {pendingBless: true}));
    return true;
  },
  customFns: {
    eventNextPlayer: (trait) => trait
  }
};

export const TraitMirror = {
  type: tt.TraitMirror,
  defense: true,
  targetType: TRAIT_TARGET_TYPE.TRAIT,
  cooldowns: fromJS([[tt.TraitMirror, TRAIT_COOLDOWN_PLACE.TRAIT, TRAIT_COOLDOWN_DURATION.ACTIVATION]]),
  action: (game, sourceAnimal, trait, targetTrait, attackAnimal, attackTrait) => (dispatch) => {
    dispatch(server$traitStartCooldown(game.id, trait, sourceAnimal));
    // reflect: remove the incoming trait from attacker and attach to attacker instead
    dispatch(server$traitAnimalRemoveTrait(game, attackAnimal.ownerId, attackAnimal.id, attackTrait.id));
    dispatch(server$traitNotify_End(game.id, sourceAnimal.id, trait));
    return true;
  }
};

export const TraitManaDrain = {
  type: tt.TraitManaDrain,
  defense: true,
  targetType: TRAIT_TARGET_TYPE.NONE,
  cooldowns: fromJS([[tt.TraitManaDrain, TRAIT_COOLDOWN_PLACE.TRAIT, TRAIT_COOLDOWN_DURATION.TURN]]),
  action: (game, animal, trait) => (dispatch, getState) => {
    dispatch(server$traitStartCooldown(game.id, trait, animal));
    // passive: on first attack this round drain 1 food from attacker — implemented via flag
    dispatch(server$traitSetAnimalFlag(game, animal, TRAIT_ANIMAL_FLAG.MAGIC_SHIELD, true));
    return true;
  },
  customFns: {
    onRemove: (game, animal) => (dispatch) => {
      dispatch(server$traitSetAnimalFlag(game, animal, TRAIT_ANIMAL_FLAG.MAGIC_SHIELD, false));
    }
  }
};

export const TraitPhoenix = {
  type: tt.TraitPhoenix,
  // passive: when animal dies, respawn once with 1 food
  customFns: {
    onDeath: (game, trait, animal) => (dispatch) => {
      // mark reborn; actual respawn handled by server logic — set flag so game reducer can check
      dispatch(server$traitSetAnimalFlag(game, animal, TRAIT_ANIMAL_FLAG.PHOENIX_REBORN, true));
    }
  }
};

export const TraitEntropy = {
  type: tt.TraitEntropy,
  playerControllable: true,
  targetType: TRAIT_TARGET_TYPE.ANIMAL,
  cooldowns: fromJS([[tt.TraitEntropy, TRAIT_COOLDOWN_PLACE.TRAIT, TRAIT_COOLDOWN_DURATION.TWO_TURNS]]),
  getErrorOfUseOnTarget: (game, sourceAnimal, targetAnimal) => {
    if (targetAnimal.id === sourceAnimal.id) return ERRORS.TRAIT_TARGETING_SAME_ANIMAL;
    return false;
  },
  action: (game, sourceAnimal, trait, targetAnimal) => (dispatch) => {
    dispatch(server$traitStartCooldown(game.id, trait, sourceAnimal));
    // randomize: pick a random trait from target and swap with random trait from source
    const rand = getIntRandom(0, 1);
    if (rand === 0) {
      // remove a random trait from target
      dispatch(server$traitAnimalRemoveTrait(game, targetAnimal.ownerId, targetAnimal.id, targetAnimal.traits && targetAnimal.traits.first && targetAnimal.traits.first().id));
    } else {
      // boost: steal 1 food
      dispatch(server$startFeeding(game.id, sourceAnimal.id, 1, tt.TraitEntropy, targetAnimal.id));
    }
    return true;
  }
};

export default {
  TraitMagicShield,
  TraitManaBurst,
  TraitPhaseShift,
  TraitLifeLeech,
  TraitSoulLink,
  TraitArcaneGrowth,
  TraitWildTeleport,
  TraitIllusion,
  TraitCurse,
  TraitBlessing,
  TraitMirror,
  TraitManaDrain,
  TraitPhoenix,
  TraitEntropy
};
