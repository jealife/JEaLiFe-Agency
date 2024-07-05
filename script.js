class CardStack {
    constructor() {
      this.scrollableContainer = document.querySelector("#scrollable-container");
      this.activeIndex = 0;
      this.globalScrollProgress = 0;
      this.cardCount = document.querySelectorAll(".scrollable-card").length;
      this.visibleCards = [];
      this.init();
    }
  
    init() {
      this.scrollableContainer.addEventListener(
        "scroll",
        this.handleScroll.bind(this)
      );
      this.createVisibleCards();
      this.visibleCards.forEach((card) => {
        card.update(this.globalScrollProgress, this.activeIndex);
      });
    }
  
    createVisibleCards() {
      const children = document.querySelectorAll(".visible-card");
  
      for (let i = 0; i < children.length; i++) {
        this.visibleCards.push(
          new VisibleCard(
            this.cardCount,
            this.globalScrollProgress,
            this.activeIndex,
            i
          )
        );
      }
    }
  
    handleScroll() {
      const { scrollLeft, scrollWidth, clientWidth } = this.scrollableContainer;
      const newScrollProgress = scrollLeft / (scrollWidth - clientWidth); // normalized to a value between 0 and 1
      this.globalScrollProgress = newScrollProgress;
      this.handleActiveIndex();
      this.update();
    }
  
    handleActiveIndex() {
      const relativeScrollPerCard = 1 / (this.cardCount - 1); // scroll amount per card normalized to a value between 0 and 1
  
      // the relative and normalized scroll position where the previous and next card starts
      const previousScrollSnapPoint =
        relativeScrollPerCard * (this.activeIndex - 1);
      const nextScrollSnapPoint = relativeScrollPerCard * (this.activeIndex + 1);
  
      // increment or decrement the active index when the scroll position reaches the previous or the next card
      if (
        this.globalScrollProgress <= previousScrollSnapPoint &&
        this.activeIndex > 0
      ) {
        this.activeIndex = this.activeIndex - 1;
      } else if (
        this.globalScrollProgress >= nextScrollSnapPoint &&
        this.activeIndex < this.cardCount - 1
      ) {
        this.activeIndex = this.activeIndex + 1;
      }
    }
  
    update() {
      this.visibleCards.forEach((card) => {
        card.update(this.globalScrollProgress, this.activeIndex);
      });
    }
  }
  
  class VisibleCard {
    constructor(cardCount, globalScrollProgress, activeIndex, index) {
      this.element = document.querySelectorAll(".visible-card")[index];
  
      this.cardCount = cardCount;
      this.globalScrollProgress = globalScrollProgress;
      this.activeIndex = activeIndex;
      this.index = index;
  
      this.init();
    }
  
    init() {
      // the maximum number of cards that can be visible on either side of the active card
      this.maxCardsOnOneSide = 5;
  
      this.update();
    }
  
    calculateTranslateX() {
      let translateX = 0;
  
      if (this.activeIndex === this.index) {
        if (this.absoluteCardScrollProgress < 0.5) {
          // we translate the card by 136% of its width when it is active and the scroll distance is less than half if its width
          translateX = -128 * this.cardScrollProgress;
        } else {
          // we translate the card by 128% of its width when it is active and the scroll distance is more than half if its width
          // we also add a slight offset to the translation so that when the card reaches the final position,
          // it is not completely centered, rather takes its final position as the card next or previous to the new active card
          translateX = -128 * Math.sign(this.cardScrollProgress);
          translateX += 128 * this.cardScrollProgress;
          translateX +=
            -((1 - this.absoluteCardScrollProgress / this.cardCount / 4) * 10) *
            (this.absoluteCardScrollProgress - 0.5) *
            2 *
            Math.sign(this.cardScrollProgress);
        }
      } else {
        // if the card is not active, we translate it away from the center
        // based on the relative and normalized scroll distance from the active card
        translateX =
          this.cardScrollProgress *
          -((1 - this.absoluteCardScrollProgress / this.cardCount / 4) * 10);
      }
  
      this.translateX = translateX;
    }
  
    calculateTranslateZ() {
      // translateZ adds a slight perspective effect to the cards when they are being rotated
      // the parent has it's own perspective value, so we need to adjust the translateZ value based on the scroll progress
      // to make the cards look like they are being rotated in a 3D space
      this.translateZ = 200 - this.absoluteCardScrollProgress * 40;
    }
  
    calculateRotateY() {
      let rotateY = 0;
  
      // we rotate the card based on the relative and normalized scroll distance from the active card
      // the maximum rotation is 75 degrees
      if (this.absoluteActiveCardScrollProgress < 0.5) {
        rotateY = this.absoluteActiveCardScrollProgress * -75;
      } else {
        rotateY = (1 - this.absoluteActiveCardScrollProgress) * -75;
      }
  
      if (this.index === this.activeIndex) {
        // the active card rotates more than the other cards when it moves away from the center
        if (this.absoluteCardScrollProgress < 0.5) {
          rotateY = this.absoluteCardScrollProgress * -90;
        } else {
          rotateY = (1 - this.absoluteCardScrollProgress) * -90;
        }
      }
  
      // the further the card is from the active card, the less it rotates
      rotateY *=
        Math.sign(this.activeCardScrollProgress) *
        (1 - Math.abs(this.activeIndex - this.index) / this.cardCount);
  
      this.rotateY = rotateY;
    }
  
    calculateRotateZ() {
      this.rotateZ = this.cardScrollProgress * 2 * -1;
    }
  
    calculateScale() {
      // cards scale down as they move away from the active card
      let scale = 1 - this.absoluteCardScrollProgress * 0.05;
  
      // the active card scales down more than the other cards when it is away from the center
      if (this.index === this.activeIndex) {
        if (this.absoluteCardScrollProgress < 0.5) {
          scale -= this.absoluteCardScrollProgress * 0.25;
        } else {
          scale -= (1 - this.absoluteCardScrollProgress) * 0.25;
        }
      }
  
      if (scale < 0) {
        scale = 0;
      }
  
      this.scale = scale;
    }
  
    calculateZIndex() {
      const distanceIndex = Math.abs(this.activeIndex - this.index); // the distance of the card from the active card in terms of index
      let zIndex = this.cardCount - distanceIndex; // the further the card is from the active card, the less the z-index
  
      // normally the cards at equal distance from the active card should have the same z-index
      // so we switch the z-index of the cards based on the scroll direction
      // this is so that the cards that are visible when the active card is moved in either direction need to be on top
      if (Math.sign(this.activeCardScrollProgress) === -1) {
        if (this.index < this.activeIndex) {
          zIndex += 1;
          if (this.activeCardScrollProgress < -0.5) {
            zIndex += 1;
          }
        }
      }
      if (Math.sign(this.activeCardScrollProgress) === 1) {
        if (this.index === this.activeIndex) {
          zIndex += 1;
        }
        if (this.index > this.activeIndex) {
          zIndex += 1;
          if (this.activeCardScrollProgress > 0.5) {
            zIndex += 1;
          }
        }
      }
  
      this.zIndex = zIndex;
    }
  
    calculateOpacity() {
      // the further the card is from the active card, the less the opacity
      // the cards with index difference of more than maxCardsOnOneSide from the center have 0 opacity
      // they fade in as they move towards the center, and fade out as they move away from the center
      let opacity = this.maxCardsOnOneSide - this.absoluteCardScrollProgress;
  
      if (opacity < 0) {
        opacity = 0;
      }
      if (opacity > 1) {
        opacity = 1;
      }
  
      this.opacity = opacity;
    }
  
    applyStyles() {
      this.element.style.transform = `translateX(${
        this.translateX - 50
      }%) translateY(-50%) translateZ(${this.translateZ}px) rotateY(${
        this.rotateY
      }deg) rotateZ(${this.rotateZ}deg) scale(${this.scale})`;
      this.element.style.zIndex = this.zIndex;
      this.element.style.opacity = this.opacity;
    }
  
    update(globalScrollProgress, activeIndex) {
      this.globalScrollProgress = globalScrollProgress;
      this.activeIndex = activeIndex;
  
      this.relativeScrollPerCard =
        this.cardCount > 1 ? 1 / (this.cardCount - 1) : 1; // scroll amount per card normalized to a value between 0 and 1
      this.cardRelativeScrollStart = this.relativeScrollPerCard * this.index; // the relative and normalized scroll position where the card starts
      this.cardScrollProgress =
        (this.globalScrollProgress - this.cardRelativeScrollStart) /
        this.relativeScrollPerCard; // normalized relative scroll progress of the card
      this.absoluteCardScrollProgress = Math.abs(this.cardScrollProgress); // absolute version of the card scroll progress
      this.activeCardScrollProgress =
        this.globalScrollProgress / this.relativeScrollPerCard - this.activeIndex; // normalized relative scroll progress of the active card
      this.absoluteActiveCardScrollProgress = Math.abs(
        this.activeCardScrollProgress
      ); // absolute version of the active card scroll progress
  
      this.calculateZIndex();
      this.calculateTranslateX();
      this.calculateTranslateZ();
      this.calculateRotateY();
      this.calculateRotateZ();
      this.calculateScale();
      this.calculateOpacity();
  
      this.applyStyles();
    }
  }
  
  const cardStack = new CardStack();