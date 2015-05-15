/**
 * TODO implement check permissions
 * Check for permissions cases:
 *  1) 'creator' -> all modifications of other members rights
 *  2) 'editor' -> can increase the level of rights of other members up to 'editor'
 *  3) 'executor' -> modifications of rights are not allowed
 *  4) 'read-only' -> forbidden any changes
 * @param req
 * @param res
 * @param next
 */
function checkRights(req, res, next) {
    next();
}

module.exports.checkRights = checkRights;