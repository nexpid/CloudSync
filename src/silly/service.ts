function hslToHex(h: number, s: number, l: number) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0"); // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function mixClr(a: number, b: number, mix: number) {
  return Math.floor(a * mix + b * (1 - mix));
}

export class SillyService {
  static getRandomColors() {
    const colors = {
      bg: "",
      cloud: "",
      cloudOutline: "",
    };

    const baseH = Math.floor(Math.random() * 360);
    const baseS = Math.floor(Math.random() * 90 * 1.1);
    const baseL = Math.floor(Math.random() * 10 + 55);

    const outlineDiff = Math.floor(Math.random() * 5 + 20);

    colors.cloud = hslToHex(baseH, baseS, baseL);
    colors.cloudOutline = hslToHex(
      baseH,
      baseS,
      baseL + (Math.random() <= 0.6 ? outlineDiff / 2 : -outlineDiff),
    );

    const bgHDiff = Math.floor(Math.random() * 45 + 45);
    const bgH = 360 + (Math.random() <= 0.6 ? bgHDiff : -bgHDiff);
    const bgS = mixClr(Math.floor(Math.random() * 90 * 1.1), baseS, 0.9);
    const bgL = mixClr(Math.floor(Math.random() * 10 + 55), baseL, 0.9);

    colors.bg = hslToHex(bgH, bgS, bgL);

    return colors;
  }

  static getIcon() {
    return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="1024" fill="#FF0000"/><g filter="url(#filter0_d_413_29)"><path d="M708.378 764H304.059C87.5679 740.835 79.0305 499.437 227.22 447.622C210.754 379.347 312.597 307.415 389.436 363.498C482.74 226.949 719.965 197.079 788.876 440.916C946.823 486.635 941.335 752.418 708.378 764Z" fill="#00FF00"/><path d="M776.848 444.315L778.735 450.994L785.401 452.923C857.307 473.737 892.864 544.856 882.847 613.453C873.012 680.808 818.662 745.886 708.064 751.5H304.733C202.197 740.289 150.978 678.284 141.24 614.664C131.35 550.051 163.699 483.074 231.346 459.421L242.024 455.688L239.372 444.691C232.875 417.752 249.54 387.51 279.698 369.687C309.199 352.253 348.374 349.003 382.066 373.595L392.482 381.196L399.756 370.55C444.053 305.722 522.515 266.437 597.373 272.028C671.003 277.527 743.614 326.722 776.848 444.315Z" stroke="#0000FF" stroke-width="25"/></g><g filter="url(#filter1_d_413_29)"><path d="M708.378 786.5H708.937L709.495 786.472C836.187 780.173 905.104 703.262 917.48 618.51C929.009 539.557 890.518 453.839 807.074 423.215C768.809 301.44 687.545 243.665 599.979 237.125C518.848 231.066 435.975 269.421 383.631 333.706C341.533 312.786 295.983 319.408 261.891 339.556C229.124 358.921 202.536 393.916 202.904 433.258C128.94 467.874 95.3874 546.423 106.643 619.959C118.959 700.42 183.93 773.775 301.665 786.372L302.859 786.5H304.059H708.378Z" stroke="white" stroke-width="45" shape-rendering="crispEdges"/></g><path d="M413.979 690.909C407.281 691.731 401.185 686.968 400.362 680.27V680.27C399.54 673.572 404.303 667.476 411.001 666.654L443.661 662.643C446.236 662.327 446.975 658.945 444.767 657.583V657.583C425.831 645.957 411.463 632.538 401.662 617.327C391.86 602.117 385.736 584.54 383.287 564.596C379.779 536.029 385.049 509.325 399.097 484.483C410.385 464.522 425.672 448.706 444.956 437.037C452.08 432.726 460.847 437.629 461.862 445.894V445.894C462.483 450.952 459.89 455.813 455.594 458.553C439.881 468.576 427.606 482.159 418.767 499.303C408.603 519.017 404.862 539.788 407.542 561.618C409.627 578.597 414.605 592.963 422.477 604.718C430.349 616.472 440.238 626.269 452.143 634.108V634.108C457.691 637.057 464.261 632.541 463.496 626.305L460.648 603.109C459.825 596.411 464.588 590.314 471.286 589.492V589.492C477.984 588.67 484.081 593.433 484.903 600.131L492.393 661.131C493.739 672.094 485.943 682.073 474.979 683.419L413.979 690.909ZM580.701 658.182C573.487 662.578 564.592 657.604 563.562 649.219V649.219C562.93 644.067 565.583 639.12 569.968 636.344C585.822 626.304 598.045 612.739 606.637 595.647C616.531 575.967 620.138 555.212 617.457 533.382C615.869 520.446 611.089 507.696 603.118 495.133C595.147 482.57 585.412 471.797 573.913 462.813V462.813C568.887 459.31 562.086 463.407 562.832 469.488L565.565 491.742C566.387 498.44 561.624 504.537 554.926 505.359V505.359C548.228 506.182 542.132 501.418 541.309 494.721L533.82 433.72C532.473 422.757 540.27 412.778 551.233 411.432L612.233 403.942C618.931 403.12 625.028 407.883 625.85 414.581V414.581C626.673 421.279 621.909 427.375 615.212 428.197L582.676 432.192C579.709 432.557 578.722 436.367 581.14 438.126V438.126C599.164 451.233 613.277 465.914 623.48 482.169C633.683 498.425 639.76 514.503 641.713 530.404C645.22 558.971 640.026 585.734 626.129 610.694C615.004 630.677 599.861 646.506 580.701 658.182Z" fill="white" fill-opacity="0.5"/><defs><filter id="filter0_d_413_29" x="77" y="259" width="870" height="655" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dy="100"/><feGaussianBlur stdDeviation="25"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_413_29"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_413_29" result="shape"/></filter><filter id="filter1_d_413_29" x="81.0277" y="213.998" width="861.934" height="616.002" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dy="20"/><feGaussianBlur stdDeviation="0.5"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_413_29"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_413_29" result="shape"/></filter></defs></svg>`;
  }

  static getBanner() {
    return `<svg width="4080" height="1440" viewBox="0 0 4080 1440" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_415_2)"><rect width="4080" height="1440" fill="#00FF00"/><path d="M487.586 1119.97C149.312 921.613 -25.4568 1114.72 -90.3807 1262.93L-80.6816 1560.16L4068.1 1583.56C4320.93 1439.33 4783.34 932.844 4384.57 930.265C3859.74 926.87 3506.53 903.199 3345.5 812.223C2946.5 586.815 2778.58 1169.31 2349.93 1031.35C1698.5 821.686 1860.04 1227.13 1502.54 1059C701.091 682.087 733.057 1263.91 487.586 1119.97Z" fill="#FF0000"/><path d="M555.516 512.263C284.233 613.031 -3.65607 435.047 -113.69 333.458L-86.207 -190.953L4375.05 10.7165L4563.53 318.577C4366.24 308.237 3790.02 725.597 3571.16 379.919C3421.07 142.863 3297.45 612.724 2442.28 207.407C2223.8 103.856 2514.38 983.018 1735.09 574.081C939.431 156.555 894.621 386.302 555.516 512.263Z" fill="#0000FF"/></g><defs><clipPath id="clip0_415_2"><rect width="4080" height="1440" fill="white"/></clipPath></defs></svg>`;
  }

  // https://github.com/Equicord/Equicord/blob/85faac8c3f8b6beea2d2a61134b65ddffa872fd5/src/plugins/fakeProfileThemes/index.tsx#L43-L53
  static getFtpe(primary: string, accent: string) {
    const message = `[${primary},${accent}]`;
    const padding = "";
    const encoded = Array.from(message)
      .map((x) => x.codePointAt(0))
      .filter((x) => x! >= 0x20 && x! <= 0x7f)
      .map((x) => String.fromCodePoint(x! + 0xe0000))
      .join("");

    return (padding || "") + " " + encoded;
  }
}
