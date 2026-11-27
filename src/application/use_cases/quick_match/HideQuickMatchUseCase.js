import QuickMatchAssembler from '../../assemblers/QuickMatchAssembler';

/**
 * Use Case: Hide Quick Match
 *
 * Puts the quick match in the current user's bin: it leaves their history and
 * their activity feed, with no way back.
 *
 * The other participants keep seeing it until they bin it too. Once every
 * participant with an active account has, the server deletes it for real (BE
 * #939). Only a finished or cancelled match can be binned: the server answers
 * 409 for one still alive, and 404 once it no longer exists.
 */
class HideQuickMatchUseCase {
  #quickMatchRepository;

  constructor({ quickMatchRepository }) {
    if (!quickMatchRepository) {
      throw new Error('HideQuickMatchUseCase requires quickMatchRepository');
    }
    this.#quickMatchRepository = quickMatchRepository;
  }

  async execute(quickMatchId) {
    if (!quickMatchId) {
      throw new Error('quickMatchId is required');
    }

    const quickMatch = await this.#quickMatchRepository.hide(quickMatchId);
    return QuickMatchAssembler.toSimpleDTO(quickMatch);
  }
}

export default HideQuickMatchUseCase;
