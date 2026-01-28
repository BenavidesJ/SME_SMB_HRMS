/**
 * Un episodio es una secuencia contigua de días con el mismo eventType.
 *
 * @typedef {Object} Episode
 * @property {string} eventType
 * @property {string} startDate
 * @property {string} endDate
 * @property {number} length
 * @property {Array<Object>} days
 */

/**
 * Agrupa TimelineDay[] en episodios consecutivos.
 *
 * @param {Array<import("./timelineTypes.js").TimelineDay>} timelineDays
 * @returns {{
 *   episodes: Episode[],
 *   daysWithEpisodeInfo: Array<import("./timelineTypes.js").TimelineDay & {
 *     episodeIndex: number,
 *     dayIndexInEpisode: number,
 *     episodeLength: number,
 *     episodeStart: string,
 *     episodeEnd: string,
 *   }>
 * }}
 */
export function buildEpisodes(timelineDays) {
  if (!Array.isArray(timelineDays)) {
    throw new Error("buildEpisodes: timelineDays debe ser un arreglo");
  }

  const episodes = [];
  const daysWithEpisodeInfo = [];

  let currentEpisode = null;
  let episodeIndex = -1;

  for (const day of timelineDays) {
    if (
      !currentEpisode ||
      currentEpisode.eventType !== day.eventType
    ) {
      if (currentEpisode) {
        currentEpisode.endDate =
          currentEpisode.days[currentEpisode.days.length - 1].date;
        currentEpisode.length = currentEpisode.days.length;
        episodes.push(currentEpisode);
      }

      episodeIndex += 1;
      currentEpisode = {
        eventType: day.eventType,
        startDate: day.date,
        endDate: day.date,
        length: 0,
        days: [],
      };
    }

    currentEpisode.days.push(day);

    const dayIndexInEpisode = currentEpisode.days.length - 1;

    daysWithEpisodeInfo.push({
      ...day,
      episodeIndex,
      dayIndexInEpisode,
      episodeLength: null,
      episodeStart: currentEpisode.startDate,
      episodeEnd: null,
    });
  }

  if (currentEpisode) {
    currentEpisode.endDate =
      currentEpisode.days[currentEpisode.days.length - 1].date;
    currentEpisode.length = currentEpisode.days.length;
    episodes.push(currentEpisode);
  }

  for (let i = 0; i < daysWithEpisodeInfo.length; i++) {
    const d = daysWithEpisodeInfo[i];
    const ep = episodes[d.episodeIndex];

    daysWithEpisodeInfo[i] = {
      ...d,
      episodeLength: ep.length,
      episodeStart: ep.startDate,
      episodeEnd: ep.endDate,
    };
  }

  return {
    episodes,
    daysWithEpisodeInfo,
  };
}
