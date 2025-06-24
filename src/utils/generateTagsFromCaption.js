const formations = [
  "trips",
  "doubles",
  "bunch",
  "empty",
  "wing",
  "tight",
  "stack",
  "pistol",
  "under center",
  "gun",
  "singleback",
  "offset",
];

const playTypes = [
  "inside zone",
  "outside zone",
  "power",
  "counter",
  "jet sweep",
  "toss",
  "iso",
  "bootleg",
  "play action",
  "rpo",
  "screen",
  "slant",
  "post",
  "fade",
  "corner",
  "wheel",
  "flood",
  "mesh",
  "snag",
  "levels",
];

const strategies = [
  "motion",
  "red zone",
  "third down",
  "goal line",
  "two minute",
  "tempo",
  "trick play",
  "double pass",
  "reverse",
  "fake",
];

exports.generateTagsFromCaption = (caption = "") => {
  const tags = [];
  const lc = caption.toLowerCase();

  const matchKeywords = (list) => {
    return list.filter((keyword) => lc.includes(keyword));
  };

  tags.push(
    ...matchKeywords(formations),
    ...matchKeywords(playTypes),
    ...matchKeywords(strategies)
  );

  return Array.from(new Set(tags)); // remove duplicates
};
