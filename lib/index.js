'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _pngCrop = require('png-crop');

var _pngCrop2 = _interopRequireDefault(_pngCrop);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

exports['default'] = {
    /**
     * @param {Object} wdioInstance
     */
    init: function init(wdioInstance) {
        wdioInstance.addCommand('getElementRect', getElementRect);
        wdioInstance.addCommand('takeElementScreenshot', takeElementScreenshot);
        wdioInstance.addCommand('saveElementScreenshot', saveElementScreenshot);
    }
};

/**
 * @param {String} elementSelector
 * @param {String} filename
 * @returns {Promise}
 */
function saveElementScreenshot(elementSelector, filename) {
    var _this = this;

    return new Promise(function (resolve) {
        _this.takeElementScreenshot(elementSelector).then(function (imageBuffer) {
            if (!imageBuffer) {
                return resolve(null);
            }
            _fs2['default'].writeFile(filename, imageBuffer, function (err) {
                return resolve(err ? null : imageBuffer);
            });
        });
    });
}

/**
 * @param {String} elementSelector
 */
function takeElementScreenshot(elementSelector) {
    if (typeof elementSelector !== 'string') {
        return Promise.resolve(null);
    }
    return Promise.all([this.getElementRect(elementSelector), this.saveScreenshot()]).then(cropScreenshot);
}

/**
 * @param {String} elementSelector
 * @returns {Promise}
 */
function getElementRect(elementSelector) {
    return this.execute(getElementBoundingRect, elementSelector).then(function (resp) {
        return resp.value ? resp.value : null;
    });
}

/**
 * @param {Object} rect
 * @param {String} screenshot
 * @returns {Promise}
 */
function cropScreenshot(_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var rect = _ref2[0];
    var screenshot = _ref2[1];

    if (!rect || !screenshot) {
        return Promise.resolve(null);
    }
    var cropConfig = {
        left: Math.round(rect.left * rect.devicePixelRatio),
        top: Math.round(rect.top * rect.devicePixelRatio),
        width: Math.round(rect.width * rect.devicePixelRatio),
        height: Math.round(rect.height * rect.devicePixelRatio)
    };
    return new Promise(function (resolve) {
        _pngCrop2['default'].cropToStream(screenshot, cropConfig, function (err, outputStream) {
            if (err) {
                return resolve(null);
            }
            var buffers = [];
            outputStream.on('data', function (chunk) {
                buffers.push(chunk);
            }).on('end', function () {
                return resolve(Buffer.concat(buffers));
            });
        });
    });
}

/**
 * Gets the position and size of an element.
 *
 * This function is run in the browser so its scope must be contained.
 *
 * @param {String} elementSelector
 * @returns {Object|undefined}
 */
function getElementBoundingRect(elementSelector) {
    /**
     * @param {Window} win
     * @param {Object} [dims]
     * @returns {Object}
     */
    function computeFrameOffset(win, dims) {
        // initialize our result variable
        dims = dims || {
            left: win.pageXOffset,
            top: win.pageYOffset
        };

        // add the offset & recurse up the frame chain
        var frame = win.frameElement;
        if (frame) {
            var rect = frame.getBoundingClientRect();
            dims.left += rect.left + frame.contentWindow.pageXOffset;
            dims.top += rect.top + frame.contentWindow.pageYOffset;

            if (win !== window.top) {
                computeFrameOffset(win.parent, dims);
            }
        }

        return dims;
    }

    /**
     * @param {HTMLElement} element
     * @param {Object} frameOffset
     * @param {Window} win
     * @returns {Object}
     */
    function computeElementRect(element, frameOffset, win) {
        var rect = element.getBoundingClientRect();

        return {
            left: rect.left + frameOffset.left,
            right: rect.right + frameOffset.left,
            top: rect.top + frameOffset.top,
            bottom: rect.bottom + frameOffset.top,
            width: rect.width,
            height: rect.height,
            devicePixelRatio: win.devicePixelRatio || 1
        };
    }

    var element = document.querySelectorAll(elementSelector)[0];
    if (element) {
        var frameOffset = computeFrameOffset(window);
        var elementRect = computeElementRect(element, frameOffset, window);

        return elementRect;
    }
}
module.exports = exports['default'];