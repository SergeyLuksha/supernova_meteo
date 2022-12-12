"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoTIFFImage = exports.Pool = exports.writeArrayBuffer = exports.fromUrls = exports.fromBlob = exports.fromFile = exports.fromArrayBuffer = exports.fromUrl = exports.MultiGeoTIFF = exports.GeoTIFF = exports.setLogger = exports.addDecoder = exports.getDecoder = exports.rgb = exports.globals = void 0;
/** @module geotiff */
const geotiffimage_js_1 = __importDefault(require("./geotiffimage.js"));
exports.GeoTIFFImage = geotiffimage_js_1.default;
const dataview64_js_1 = __importDefault(require("./dataview64.js"));
const dataslice_js_1 = __importDefault(require("./dataslice.js"));
const pool_js_1 = __importDefault(require("./pool.js"));
exports.Pool = pool_js_1.default;
const remote_js_1 = require("./source/remote.js");
const arraybuffer_js_1 = require("./source/arraybuffer.js");
const filereader_js_1 = require("./source/filereader.js");
const file_js_1 = require("./source/file.js");
const globals_js_1 = require("./globals.js");
const geotiffwriter_js_1 = require("./geotiffwriter.js");
const globals = __importStar(require("./globals.js"));
exports.globals = globals;
const rgb = __importStar(require("./rgb.js"));
exports.rgb = rgb;
const index_js_1 = require("./compression/index.js");
Object.defineProperty(exports, "getDecoder", { enumerable: true, get: function () { return index_js_1.getDecoder; } });
Object.defineProperty(exports, "addDecoder", { enumerable: true, get: function () { return index_js_1.addDecoder; } });
const logging_js_1 = require("./logging.js");
Object.defineProperty(exports, "setLogger", { enumerable: true, get: function () { return logging_js_1.setLogger; } });
/**
 * @typedef {Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array}
 * TypedArray
 */
function getFieldTypeLength(fieldType) {
    switch (fieldType) {
        case globals_js_1.fieldTypes.BYTE:
        case globals_js_1.fieldTypes.ASCII:
        case globals_js_1.fieldTypes.SBYTE:
        case globals_js_1.fieldTypes.UNDEFINED:
            return 1;
        case globals_js_1.fieldTypes.SHORT:
        case globals_js_1.fieldTypes.SSHORT:
            return 2;
        case globals_js_1.fieldTypes.LONG:
        case globals_js_1.fieldTypes.SLONG:
        case globals_js_1.fieldTypes.FLOAT:
        case globals_js_1.fieldTypes.IFD:
            return 4;
        case globals_js_1.fieldTypes.RATIONAL:
        case globals_js_1.fieldTypes.SRATIONAL:
        case globals_js_1.fieldTypes.DOUBLE:
        case globals_js_1.fieldTypes.LONG8:
        case globals_js_1.fieldTypes.SLONG8:
        case globals_js_1.fieldTypes.IFD8:
            return 8;
        default:
            throw new RangeError(`Invalid field type: ${fieldType}`);
    }
}
function parseGeoKeyDirectory(fileDirectory) {
    const rawGeoKeyDirectory = fileDirectory.GeoKeyDirectory;
    if (!rawGeoKeyDirectory) {
        return null;
    }
    const geoKeyDirectory = {};
    for (let i = 4; i <= rawGeoKeyDirectory[3] * 4; i += 4) {
        const key = globals_js_1.geoKeyNames[rawGeoKeyDirectory[i]];
        const location = (rawGeoKeyDirectory[i + 1])
            ? (globals_js_1.fieldTagNames[rawGeoKeyDirectory[i + 1]]) : null;
        const count = rawGeoKeyDirectory[i + 2];
        const offset = rawGeoKeyDirectory[i + 3];
        let value = null;
        if (!location) {
            value = offset;
        }
        else {
            value = fileDirectory[location];
            if (typeof value === 'undefined' || value === null) {
                throw new Error(`Could not get value of geoKey '${key}'.`);
            }
            else if (typeof value === 'string') {
                value = value.substring(offset, offset + count - 1);
            }
            else if (value.subarray) {
                value = value.subarray(offset, offset + count);
                if (count === 1) {
                    value = value[0];
                }
            }
        }
        geoKeyDirectory[key] = value;
    }
    return geoKeyDirectory;
}
function getValues(dataSlice, fieldType, count, offset) {
    let values = null;
    let readMethod = null;
    const fieldTypeLength = getFieldTypeLength(fieldType);
    switch (fieldType) {
        case globals_js_1.fieldTypes.BYTE:
        case globals_js_1.fieldTypes.ASCII:
        case globals_js_1.fieldTypes.UNDEFINED:
            values = new Uint8Array(count);
            readMethod = dataSlice.readUint8;
            break;
        case globals_js_1.fieldTypes.SBYTE:
            values = new Int8Array(count);
            readMethod = dataSlice.readInt8;
            break;
        case globals_js_1.fieldTypes.SHORT:
            values = new Uint16Array(count);
            readMethod = dataSlice.readUint16;
            break;
        case globals_js_1.fieldTypes.SSHORT:
            values = new Int16Array(count);
            readMethod = dataSlice.readInt16;
            break;
        case globals_js_1.fieldTypes.LONG:
        case globals_js_1.fieldTypes.IFD:
            values = new Uint32Array(count);
            readMethod = dataSlice.readUint32;
            break;
        case globals_js_1.fieldTypes.SLONG:
            values = new Int32Array(count);
            readMethod = dataSlice.readInt32;
            break;
        case globals_js_1.fieldTypes.LONG8:
        case globals_js_1.fieldTypes.IFD8:
            values = new Array(count);
            readMethod = dataSlice.readUint64;
            break;
        case globals_js_1.fieldTypes.SLONG8:
            values = new Array(count);
            readMethod = dataSlice.readInt64;
            break;
        case globals_js_1.fieldTypes.RATIONAL:
            values = new Uint32Array(count * 2);
            readMethod = dataSlice.readUint32;
            break;
        case globals_js_1.fieldTypes.SRATIONAL:
            values = new Int32Array(count * 2);
            readMethod = dataSlice.readInt32;
            break;
        case globals_js_1.fieldTypes.FLOAT:
            values = new Float32Array(count);
            readMethod = dataSlice.readFloat32;
            break;
        case globals_js_1.fieldTypes.DOUBLE:
            values = new Float64Array(count);
            readMethod = dataSlice.readFloat64;
            break;
        default:
            throw new RangeError(`Invalid field type: ${fieldType}`);
    }
    // normal fields
    if (!(fieldType === globals_js_1.fieldTypes.RATIONAL || fieldType === globals_js_1.fieldTypes.SRATIONAL)) {
        for (let i = 0; i < count; ++i) {
            values[i] = readMethod.call(dataSlice, offset + (i * fieldTypeLength));
        }
    }
    else { // RATIONAL or SRATIONAL
        for (let i = 0; i < count; i += 2) {
            values[i] = readMethod.call(dataSlice, offset + (i * fieldTypeLength));
            values[i + 1] = readMethod.call(dataSlice, offset + ((i * fieldTypeLength) + 4));
        }
    }
    if (fieldType === globals_js_1.fieldTypes.ASCII) {
        return new TextDecoder('utf-8').decode(values);
    }
    return values;
}
/**
 * Data class to store the parsed file directory, geo key directory and
 * offset to the next IFD
 */
class ImageFileDirectory {
    constructor(fileDirectory, geoKeyDirectory, nextIFDByteOffset) {
        this.fileDirectory = fileDirectory;
        this.geoKeyDirectory = geoKeyDirectory;
        this.nextIFDByteOffset = nextIFDByteOffset;
    }
}
/**
 * Error class for cases when an IFD index was requested, that does not exist
 * in the file.
 */
class GeoTIFFImageIndexError extends Error {
    constructor(index) {
        super(`No image at index ${index}`);
        this.index = index;
    }
}
class GeoTIFFBase {
    /**
     * (experimental) Reads raster data from the best fitting image. This function uses
     * the image with the lowest resolution that is still a higher resolution than the
     * requested resolution.
     * When specified, the `bbox` option is translated to the `window` option and the
     * `resX` and `resY` to `width` and `height` respectively.
     * Then, the [readRasters]{@link GeoTIFFImage#readRasters} method of the selected
     * image is called and the result returned.
     * @see GeoTIFFImage.readRasters
     * @param {import('./geotiffimage').ReadRasterOptions} [options={}] optional parameters
     * @returns {Promise<(TypedArray|TypedArray[])>} the decoded arrays as a promise
     */
    async readRasters(options = {}) {
        const { window: imageWindow, width, height } = options;
        let { resX, resY, bbox } = options;
        const firstImage = await this.getImage();
        let usedImage = firstImage;
        const imageCount = await this.getImageCount();
        const imgBBox = firstImage.getBoundingBox();
        if (imageWindow && bbox) {
            throw new Error('Both "bbox" and "window" passed.');
        }
        // if width/height is passed, transform it to resolution
        if (width || height) {
            // if we have an image window (pixel coordinates), transform it to a BBox
            // using the origin/resolution of the first image.
            if (imageWindow) {
                const [oX, oY] = firstImage.getOrigin();
                const [rX, rY] = firstImage.getResolution();
                bbox = [
                    oX + (imageWindow[0] * rX),
                    oY + (imageWindow[1] * rY),
                    oX + (imageWindow[2] * rX),
                    oY + (imageWindow[3] * rY),
                ];
            }
            // if we have a bbox (or calculated one)
            const usedBBox = bbox || imgBBox;
            if (width) {
                if (resX) {
                    throw new Error('Both width and resX passed');
                }
                resX = (usedBBox[2] - usedBBox[0]) / width;
            }
            if (height) {
                if (resY) {
                    throw new Error('Both width and resY passed');
                }
                resY = (usedBBox[3] - usedBBox[1]) / height;
            }
        }
        // if resolution is set or calculated, try to get the image with the worst acceptable resolution
        if (resX || resY) {
            const allImages = [];
            for (let i = 0; i < imageCount; ++i) {
                const image = await this.getImage(i);
                const { SubfileType: subfileType, NewSubfileType: newSubfileType } = image.fileDirectory;
                if (i === 0 || subfileType === 2 || newSubfileType & 1) {
                    allImages.push(image);
                }
            }
            allImages.sort((a, b) => a.getWidth() - b.getWidth());
            for (let i = 0; i < allImages.length; ++i) {
                const image = allImages[i];
                const imgResX = (imgBBox[2] - imgBBox[0]) / image.getWidth();
                const imgResY = (imgBBox[3] - imgBBox[1]) / image.getHeight();
                usedImage = image;
                if ((resX && resX > imgResX) || (resY && resY > imgResY)) {
                    break;
                }
            }
        }
        let wnd = imageWindow;
        if (bbox) {
            const [oX, oY] = firstImage.getOrigin();
            const [imageResX, imageResY] = usedImage.getResolution(firstImage);
            wnd = [
                Math.round((bbox[0] - oX) / imageResX),
                Math.round((bbox[1] - oY) / imageResY),
                Math.round((bbox[2] - oX) / imageResX),
                Math.round((bbox[3] - oY) / imageResY),
            ];
            wnd = [
                Math.min(wnd[0], wnd[2]),
                Math.min(wnd[1], wnd[3]),
                Math.max(wnd[0], wnd[2]),
                Math.max(wnd[1], wnd[3]),
            ];
        }
        return usedImage.readRasters({ ...options, window: wnd });
    }
}
/**
 * @typedef {Object} GeoTIFFOptions
 * @property {boolean} [cache=false] whether or not decoded tiles shall be cached.
 */
/**
 * The abstraction for a whole GeoTIFF file.
 * @augments GeoTIFFBase
 */
class GeoTIFF extends GeoTIFFBase {
    /**
     * @constructor
     * @param {*} source The datasource to read from.
     * @param {boolean} littleEndian Whether the image uses little endian.
     * @param {boolean} bigTiff Whether the image uses bigTIFF conventions.
     * @param {number} firstIFDOffset The numeric byte-offset from the start of the image
     *                                to the first IFD.
     * @param {GeoTIFFOptions} [options] further options.
     */
    constructor(source, littleEndian, bigTiff, firstIFDOffset, options = {}) {
        super();
        this.source = source;
        this.littleEndian = littleEndian;
        this.bigTiff = bigTiff;
        this.firstIFDOffset = firstIFDOffset;
        this.cache = options.cache || false;
        this.ifdRequests = [];
        this.ghostValues = null;
    }
    async getSlice(offset, size) {
        const fallbackSize = this.bigTiff ? 4048 : 1024;
        return new dataslice_js_1.default((await this.source.fetch([{
                offset,
                length: typeof size !== 'undefined' ? size : fallbackSize,
            }]))[0], offset, this.littleEndian, this.bigTiff);
    }
    /**
     * Instructs to parse an image file directory at the given file offset.
     * As there is no way to ensure that a location is indeed the start of an IFD,
     * this function must be called with caution (e.g only using the IFD offsets from
     * the headers or other IFDs).
     * @param {number} offset the offset to parse the IFD at
     * @returns {Promise<ImageFileDirectory>} the parsed IFD
     */
    async parseFileDirectoryAt(offset) {
        const entrySize = this.bigTiff ? 20 : 12;
        const offsetSize = this.bigTiff ? 8 : 2;
        let dataSlice = await this.getSlice(offset);
        const numDirEntries = this.bigTiff
            ? dataSlice.readUint64(offset)
            : dataSlice.readUint16(offset);
        // if the slice does not cover the whole IFD, request a bigger slice, where the
        // whole IFD fits: num of entries + n x tag length + offset to next IFD
        const byteSize = (numDirEntries * entrySize) + (this.bigTiff ? 16 : 6);
        if (!dataSlice.covers(offset, byteSize)) {
            dataSlice = await this.getSlice(offset, byteSize);
        }
        const fileDirectory = {};
        // loop over the IFD and create a file directory object
        let i = offset + (this.bigTiff ? 8 : 2);
        for (let entryCount = 0; entryCount < numDirEntries; i += entrySize, ++entryCount) {
            const fieldTag = dataSlice.readUint16(i);
            const fieldType = dataSlice.readUint16(i + 2);
            const typeCount = this.bigTiff
                ? dataSlice.readUint64(i + 4)
                : dataSlice.readUint32(i + 4);
            let fieldValues;
            let value;
            const fieldTypeLength = getFieldTypeLength(fieldType);
            const valueOffset = i + (this.bigTiff ? 12 : 8);
            // check whether the value is directly encoded in the tag or refers to a
            // different external byte range
            if (fieldTypeLength * typeCount <= (this.bigTiff ? 8 : 4)) {
                fieldValues = getValues(dataSlice, fieldType, typeCount, valueOffset);
            }
            else {
                // resolve the reference to the actual byte range
                const actualOffset = dataSlice.readOffset(valueOffset);
                const length = getFieldTypeLength(fieldType) * typeCount;
                // check, whether we actually cover the referenced byte range; if not,
                // request a new slice of bytes to read from it
                if (dataSlice.covers(actualOffset, length)) {
                    fieldValues = getValues(dataSlice, fieldType, typeCount, actualOffset);
                }
                else {
                    const fieldDataSlice = await this.getSlice(actualOffset, length);
                    fieldValues = getValues(fieldDataSlice, fieldType, typeCount, actualOffset);
                }
            }
            // unpack single values from the array
            if (typeCount === 1 && globals_js_1.arrayFields.indexOf(fieldTag) === -1
                && !(fieldType === globals_js_1.fieldTypes.RATIONAL || fieldType === globals_js_1.fieldTypes.SRATIONAL)) {
                value = fieldValues[0];
            }
            else {
                value = fieldValues;
            }
            // write the tags value to the file directly
            fileDirectory[globals_js_1.fieldTagNames[fieldTag]] = value;
        }
        const geoKeyDirectory = parseGeoKeyDirectory(fileDirectory);
        const nextIFDByteOffset = dataSlice.readOffset(offset + offsetSize + (entrySize * numDirEntries));
        return new ImageFileDirectory(fileDirectory, geoKeyDirectory, nextIFDByteOffset);
    }
    async requestIFD(index) {
        // see if we already have that IFD index requested.
        if (this.ifdRequests[index]) {
            // attach to an already requested IFD
            return this.ifdRequests[index];
        }
        else if (index === 0) {
            // special case for index 0
            this.ifdRequests[index] = this.parseFileDirectoryAt(this.firstIFDOffset);
            return this.ifdRequests[index];
        }
        else if (!this.ifdRequests[index - 1]) {
            // if the previous IFD was not yet loaded, load that one first
            // this is the recursive call.
            try {
                this.ifdRequests[index - 1] = this.requestIFD(index - 1);
            }
            catch (e) {
                // if the previous one already was an index error, rethrow
                // with the current index
                if (e instanceof GeoTIFFImageIndexError) {
                    throw new GeoTIFFImageIndexError(index);
                }
                // rethrow anything else
                throw e;
            }
        }
        // if the previous IFD was loaded, we can finally fetch the one we are interested in.
        // we need to wrap this in an IIFE, otherwise this.ifdRequests[index] would be delayed
        this.ifdRequests[index] = (async () => {
            const previousIfd = await this.ifdRequests[index - 1];
            if (previousIfd.nextIFDByteOffset === 0) {
                throw new GeoTIFFImageIndexError(index);
            }
            return this.parseFileDirectoryAt(previousIfd.nextIFDByteOffset);
        })();
        return this.ifdRequests[index];
    }
    /**
     * Get the n-th internal subfile of an image. By default, the first is returned.
     *
     * @param {number} [index=0] the index of the image to return.
     * @returns {Promise<GeoTIFFImage>} the image at the given index
     */
    async getImage(index = 0) {
        const ifd = await this.requestIFD(index);
        return new geotiffimage_js_1.default(ifd.fileDirectory, ifd.geoKeyDirectory, this.dataView, this.littleEndian, this.cache, this.source);
    }
    /**
     * Returns the count of the internal subfiles.
     *
     * @returns {Promise<number>} the number of internal subfile images
     */
    async getImageCount() {
        let index = 0;
        // loop until we run out of IFDs
        let hasNext = true;
        while (hasNext) {
            try {
                await this.requestIFD(index);
                ++index;
            }
            catch (e) {
                if (e instanceof GeoTIFFImageIndexError) {
                    hasNext = false;
                }
                else {
                    throw e;
                }
            }
        }
        return index;
    }
    /**
     * Get the values of the COG ghost area as a parsed map.
     * See https://gdal.org/drivers/raster/cog.html#header-ghost-area for reference
     * @returns {Promise<Object>} the parsed ghost area or null, if no such area was found
     */
    async getGhostValues() {
        const offset = this.bigTiff ? 16 : 8;
        if (this.ghostValues) {
            return this.ghostValues;
        }
        const detectionString = 'GDAL_STRUCTURAL_METADATA_SIZE=';
        const heuristicAreaSize = detectionString.length + 100;
        let slice = await this.getSlice(offset, heuristicAreaSize);
        if (detectionString === getValues(slice, globals_js_1.fieldTypes.ASCII, detectionString.length, offset)) {
            const valuesString = getValues(slice, globals_js_1.fieldTypes.ASCII, heuristicAreaSize, offset);
            const firstLine = valuesString.split('\n')[0];
            const metadataSize = Number(firstLine.split('=')[1].split(' ')[0]) + firstLine.length;
            if (metadataSize > heuristicAreaSize) {
                slice = await this.getSlice(offset, metadataSize);
            }
            const fullString = getValues(slice, globals_js_1.fieldTypes.ASCII, metadataSize, offset);
            this.ghostValues = {};
            fullString
                .split('\n')
                .filter((line) => line.length > 0)
                .map((line) => line.split('='))
                .forEach(([key, value]) => {
                this.ghostValues[key] = value;
            });
        }
        return this.ghostValues;
    }
    /**
     * Parse a (Geo)TIFF file from the given source.
     *
     * @param {*} source The source of data to parse from.
     * @param {GeoTIFFOptions} [options] Additional options.
     * @param {AbortSignal} [signal] An AbortSignal that may be signalled if the request is
     *                               to be aborted
     */
    static async fromSource(source, options, signal) {
        const headerData = (await source.fetch([{ offset: 0, length: 1024 }], signal))[0];
        const dataView = new dataview64_js_1.default(headerData);
        const BOM = dataView.getUint16(0, 0);
        let littleEndian;
        if (BOM === 0x4949) {
            littleEndian = true;
        }
        else if (BOM === 0x4D4D) {
            littleEndian = false;
        }
        else {
            throw new TypeError('Invalid byte order value.');
        }
        const magicNumber = dataView.getUint16(2, littleEndian);
        let bigTiff;
        if (magicNumber === 42) {
            bigTiff = false;
        }
        else if (magicNumber === 43) {
            bigTiff = true;
            const offsetByteSize = dataView.getUint16(4, littleEndian);
            if (offsetByteSize !== 8) {
                throw new Error('Unsupported offset byte-size.');
            }
        }
        else {
            throw new TypeError('Invalid magic number.');
        }
        const firstIFDOffset = bigTiff
            ? dataView.getUint64(8, littleEndian)
            : dataView.getUint32(4, littleEndian);
        return new GeoTIFF(source, littleEndian, bigTiff, firstIFDOffset, options);
    }
    /**
     * Closes the underlying file buffer
     * N.B. After the GeoTIFF has been completely processed it needs
     * to be closed but only if it has been constructed from a file.
     */
    close() {
        if (typeof this.source.close === 'function') {
            return this.source.close();
        }
        return false;
    }
}
exports.GeoTIFF = GeoTIFF;
exports.default = GeoTIFF;
/**
 * Wrapper for GeoTIFF files that have external overviews.
 * @augments GeoTIFFBase
 */
class MultiGeoTIFF extends GeoTIFFBase {
    /**
     * Construct a new MultiGeoTIFF from a main and several overview files.
     * @param {GeoTIFF} mainFile The main GeoTIFF file.
     * @param {GeoTIFF[]} overviewFiles An array of overview files.
     */
    constructor(mainFile, overviewFiles) {
        super();
        this.mainFile = mainFile;
        this.overviewFiles = overviewFiles;
        this.imageFiles = [mainFile].concat(overviewFiles);
        this.fileDirectoriesPerFile = null;
        this.fileDirectoriesPerFileParsing = null;
        this.imageCount = null;
    }
    async parseFileDirectoriesPerFile() {
        const requests = [this.mainFile.parseFileDirectoryAt(this.mainFile.firstIFDOffset)]
            .concat(this.overviewFiles.map((file) => file.parseFileDirectoryAt(file.firstIFDOffset)));
        this.fileDirectoriesPerFile = await Promise.all(requests);
        return this.fileDirectoriesPerFile;
    }
    /**
     * Get the n-th internal subfile of an image. By default, the first is returned.
     *
     * @param {number} [index=0] the index of the image to return.
     * @returns {Promise<GeoTIFFImage>} the image at the given index
     */
    async getImage(index = 0) {
        await this.getImageCount();
        await this.parseFileDirectoriesPerFile();
        let visited = 0;
        let relativeIndex = 0;
        for (let i = 0; i < this.imageFiles.length; i++) {
            const imageFile = this.imageFiles[i];
            for (let ii = 0; ii < this.imageCounts[i]; ii++) {
                if (index === visited) {
                    const ifd = await imageFile.requestIFD(relativeIndex);
                    return new geotiffimage_js_1.default(ifd.fileDirectory, ifd.geoKeyDirectory, imageFile.dataView, imageFile.littleEndian, imageFile.cache, imageFile.source);
                }
                visited++;
                relativeIndex++;
            }
            relativeIndex = 0;
        }
        throw new RangeError('Invalid image index');
    }
    /**
     * Returns the count of the internal subfiles.
     *
     * @returns {Promise<number>} the number of internal subfile images
     */
    async getImageCount() {
        if (this.imageCount !== null) {
            return this.imageCount;
        }
        const requests = [this.mainFile.getImageCount()]
            .concat(this.overviewFiles.map((file) => file.getImageCount()));
        this.imageCounts = await Promise.all(requests);
        this.imageCount = this.imageCounts.reduce((count, ifds) => count + ifds, 0);
        return this.imageCount;
    }
}
exports.MultiGeoTIFF = MultiGeoTIFF;
/**
 * Creates a new GeoTIFF from a remote URL.
 * @param {string} url The URL to access the image from
 * @param {object} [options] Additional options to pass to the source.
 *                           See {@link makeRemoteSource} for details.
 * @param {AbortSignal} [signal] An AbortSignal that may be signalled if the request is
 *                               to be aborted
 * @returns {Promise<GeoTIFF>} The resulting GeoTIFF file.
 */
async function fromUrl(url, options = {}, signal) {
    return GeoTIFF.fromSource((0, remote_js_1.makeRemoteSource)(url, options), signal);
}
exports.fromUrl = fromUrl;
/**
 * Construct a new GeoTIFF from an
 * [ArrayBuffer]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer}.
 * @param {ArrayBuffer} arrayBuffer The data to read the file from.
 * @param {AbortSignal} [signal] An AbortSignal that may be signalled if the request is
 *                               to be aborted
 * @returns {Promise<GeoTIFF>} The resulting GeoTIFF file.
 */
async function fromArrayBuffer(arrayBuffer, signal) {
    return GeoTIFF.fromSource((0, arraybuffer_js_1.makeBufferSource)(arrayBuffer), signal);
}
exports.fromArrayBuffer = fromArrayBuffer;
/**
 * Construct a GeoTIFF from a local file path. This uses the node
 * [filesystem API]{@link https://nodejs.org/api/fs.html} and is
 * not available on browsers.
 *
 * N.B. After the GeoTIFF has been completely processed it needs
 * to be closed but only if it has been constructed from a file.
 * @param {string} path The file path to read from.
 * @param {AbortSignal} [signal] An AbortSignal that may be signalled if the request is
 *                               to be aborted
 * @returns {Promise<GeoTIFF>} The resulting GeoTIFF file.
 */
async function fromFile(path, signal) {
    return GeoTIFF.fromSource((0, file_js_1.makeFileSource)(path), signal);
}
exports.fromFile = fromFile;
/**
 * Construct a GeoTIFF from an HTML
 * [Blob]{@link https://developer.mozilla.org/en-US/docs/Web/API/Blob} or
 * [File]{@link https://developer.mozilla.org/en-US/docs/Web/API/File}
 * object.
 * @param {Blob|File} blob The Blob or File object to read from.
 * @param {AbortSignal} [signal] An AbortSignal that may be signalled if the request is
 *                               to be aborted
 * @returns {Promise<GeoTIFF>} The resulting GeoTIFF file.
 */
async function fromBlob(blob, signal) {
    return GeoTIFF.fromSource((0, filereader_js_1.makeFileReaderSource)(blob), signal);
}
exports.fromBlob = fromBlob;
/**
 * Construct a MultiGeoTIFF from the given URLs.
 * @param {string} mainUrl The URL for the main file.
 * @param {string[]} overviewUrls An array of URLs for the overview images.
 * @param {Object} [options] Additional options to pass to the source.
 *                           See [makeRemoteSource]{@link module:source.makeRemoteSource}
 *                           for details.
 * @param {AbortSignal} [signal] An AbortSignal that may be signalled if the request is
 *                               to be aborted
 * @returns {Promise<MultiGeoTIFF>} The resulting MultiGeoTIFF file.
 */
async function fromUrls(mainUrl, overviewUrls = [], options = {}, signal) {
    const mainFile = await GeoTIFF.fromSource((0, remote_js_1.makeRemoteSource)(mainUrl, options), signal);
    const overviewFiles = await Promise.all(overviewUrls.map((url) => GeoTIFF.fromSource((0, remote_js_1.makeRemoteSource)(url, options))));
    return new MultiGeoTIFF(mainFile, overviewFiles);
}
exports.fromUrls = fromUrls;
/**
 * Main creating function for GeoTIFF files.
 * @param {(Array)} array of pixel values
 * @returns {metadata} metadata
 */
function writeArrayBuffer(values, metadata) {
    return (0, geotiffwriter_js_1.writeGeotiff)(values, metadata);
}
exports.writeArrayBuffer = writeArrayBuffer;
//# sourceMappingURL=geotiff.js.map