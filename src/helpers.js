Number.prototype.clamp = function(min, max) { return Math.min(Math.max(this, min), max) }

// # module.exports = helpers

export function mobileCheck(){
  if (typeof navigator !== 'undefined') {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 600
  }
  return null
}
export const sample = items => items[Math.floor(Math.random()*items.length)]

export function rn(start,end) {
  if (start == null) start = 0
  if (end == null) end = 1
  return start + (Math.random() * (end - start))
}

export function ri(start,end) {
  if (start == null) start = 0
  if (end == null) end = 1
  return Math.floor(start + (Math.random() * ((end - start) + 1)))
}

export const q = sel => document.querySelector(sel)

export const color2Hex = (color) => {
  if (typeof color == 'number'){
    return '#' +  ('00000' + color.toString(16)).slice(-6)
  } else return color
}

export const color2Rgb = (color, alpha=1) => {
  const hex = color2Hex(color)
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  const obj = result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
  } : null
  return 'rgba('+ obj.r +','+ obj.g +','+ obj.b +','+ alpha +')'
}

export const getBrightness = (threeColor) => {
  return (0.299 * threeColor.r) + (0.587 * threeColor.g) + (0.114 * threeColor.b);
}

export function clearThree(obj) {
  // https://stackoverflow.com/questions/30359830/how-do-i-clear-three-js-scene/48722282
  while (obj.children && obj.children.length > 0) {
    clearThree(obj.children[0])
    obj.remove(obj.children[0])
  }
  if (obj.geometry) obj.geometry.dispose()
  if (obj.material) { // in case of map, bumpMap, normalMap, envMap ...
    Object.keys(obj.material).forEach(prop => {
      if (!obj.material[prop]) return
      if (obj.material[prop] !== null && typeof obj.material[prop].dispose === 'function') {
        obj.material[prop].dispose()
      }
    })
    obj.material.dispose()
  }
}