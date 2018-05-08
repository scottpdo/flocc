export default function gaussian(mean, sd) {
    
    let y, x1, x2, w;
    
    do {
        x1 = 2 * Math.random() - 1;
        x2 = 2 * Math.random() - 1;
        w = x1 * x1 + x2 * x2;
    } while (w >= 1);
    
    w = Math.sqrt(-2 * Math.log(w) / w);
    y = x1 * w;
  
    const m = mean || 0;
    const s = sd || 1;

    return y * s + m;
};