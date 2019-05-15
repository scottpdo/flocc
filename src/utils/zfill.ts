function zfill(str: string, width: number = 0) {
  let output = str;
  while (output.length < width) output = "0" + output;
  return output;
}

export default zfill;
