'use strict'

exports.perform = function (res, err, httpCode) {
    console.error(err);
    res.status(httpCode).end();
};

