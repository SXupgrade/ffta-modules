/**
 * @typedef {Object} LeagueSettings
 * @property {string} masterTournamentCode
 * @property {string[]} roundTournamentCodes - 1 to 8 linked round tournament codes.
 * @property {'division-class'} groupBy
 * @property {Array<{rank:number, points:number}>} qualificationPointsGrid
 * @property {'match-wins'|'bracket-final-ranking'} matchPointsMode
 * @property {number} matchWinPoints
 * @property {Array<{rank:number, points:number}>} bracketPointsGrid
 */

/**
 * @typedef {Object} LeagueInput
 * @property {LeagueSettings} settings
 * @property {Object} masterTournament
 * @property {Object[]} rounds
 * @property {Object[]} teams
 * @property {Object[]} qualificationResults
 * @property {Object[]} matchResults
 */

/**
 * @typedef {Object} LeagueStandingResult
 * @property {Array<{groupKey:string, division:string, className:string, rows:Object[]}>} groups
 * @property {LeagueWarning[]} warnings
 * @property {string} calculatedAt
 */

/**
 * @typedef {Object} LeagueWarning
 * @property {'info'|'warning'|'error'} level
 * @property {string} code
 * @property {string} messageKey
 * @property {Object=} params
 */
