/**
 * This file is part of Rembrandt.js
 * Copyright (c) 2016 PhotoEditorSDK.com
 * Licensed under MIT license (https://opensource.org/licenses/MIT)
 */

// @ifndef BROWSER
import { Canvas, Image } from 'canvas'
// @endif

export default class Utils {
  /**
   * Assigns own enumerable properties of source object(s) to the destination
   * object for all destination properties that resolve to undefined. Once a
   * property is set, additional values of the same property are ignored.
   * @param  {Object} object
   * @param  {Object} ...sources
   * @return {Object}
   */
  static defaults (object, ...sources) {
    // Shallow clone
    let newObject = {}
    for (let key in object) {
      newObject[key] = object[key]
    }

    // Clone sources
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i]
      for (let key in source) {
        if (typeof newObject[key] === 'undefined') {
          newObject[key] = source[key]
        }
      }
    }

    return newObject
  }

  /**
   * Creates a canvas with the given dimensions
   * @param  {Number} width
   * @param  {Number} height
   * @return {Canvas}
   */
  static createCanvas (width, height) {
    let canvas
    // @ifndef BROWSER
    canvas = new Canvas()
    // @endif
    // @ifdef BROWSER
    if (typeof BROWSER !== 'undefined') {
      canvas = document.createElement('canvas')
    }
    // @endif
    canvas.width = width
    canvas.height = height

    return canvas
  }

  /**
   * Creates a new image
   * @return {Image}
   */
  static createImage () {
    let image
    // @ifndef BROWSER
    image = new Image()
    // @endif
    // @ifdef BROWSER
    if (typeof BROWSER !== 'undefined') {
      image = new window.Image()
    }
    // @endif
    return image
  }
}
