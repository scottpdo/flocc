// https://github.com/moll/json-stringify-safe

export default function stringify(
  obj: Object,
  replacer?: Function,
  spaces?: string,
  cycleReplacer?: Function
): string {
  return JSON.stringify(obj, serializer(replacer, cycleReplacer), spaces);
}

function serializer(replacer?: Function, cycleReplacer?: Function) {
  const stack: string[] = [];
  const keys: string[] = [];

  if (cycleReplacer == null)
    cycleReplacer = function (key: string, value: any): string {
      if (stack[0] === value) return "[Circular ~]";
      return (
        "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
      );
    };

  return function (key: string, value: any) {
    if (stack.length > 0) {
      var thisPos = stack.indexOf(this);
      ~thisPos ? stack.splice(thisPos + 1) : stack.push(this);
      ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key);
      if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value);
    } else stack.push(value);

    return replacer == null ? value : replacer.call(this, key, value);
  };
}
