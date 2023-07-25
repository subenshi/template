module.exports.slugify = (text) => {
  return text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
}