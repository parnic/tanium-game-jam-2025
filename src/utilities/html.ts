export function showOrHideElement(elem: HTMLElement, show: boolean) {
  if (show) {
    showElement(elem);
    return;
  }

  hideElement(elem);
}

export function unhideOrHideElement(elem: HTMLElement, show: boolean) {
  if (show) {
    showElement(elem);
  }

  unhideElement(elem);
}

// adds the 'show' class to an element (which is "display: block") and removes the 'hide' class
export function showElement(elem: HTMLElement) {
  unhideElement(elem);
  elem.classList.add("show");
}

// removes the 'hide' class from an element
export function unhideElement(elem: HTMLElement) {
  elem.classList.remove("hide");
}

// adds the 'hide' class from an element and removes the 'show' class if it exists
export function hideElement(elem: HTMLElement) {
  elem.classList.remove("show");
  elem.classList.add("hide");
}

export function elementIsVisible(elem: HTMLElement) {
  return !elem.classList.contains("hide");
}
