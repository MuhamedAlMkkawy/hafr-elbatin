export const vTooltip = {
  mounted(el, binding) {
    let tooltip = null;

    const createTooltip = () => {
      const value = binding.value;
      if (!value) return;

      let title = "";
      let content = "";

      if (typeof value === "object") {
        title = value.title || "";
        content = value.content || "";
      } else {
        content = value;
      }

      tooltip = document.createElement("div");
      tooltip.className = "tooltip-container";

      const tooltipContent = document.createElement("div");
      tooltipContent.className = "tooltip-content";

      const isRTL = document.documentElement.dir === "rtl";

      if (title) {
        const header = document.createElement("div");
        header.className = "tooltip-header";

        const titleText = document.createElement("span");
        titleText.innerText = title;

        const icon = document.createElement("div");
        icon.className = "tooltip-info-icon";
        icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M9 17.25C13.5563 17.25 17.25 13.5563 17.25 9C17.25 4.44365 13.5563 0.75 9 0.75C4.44365 0.75 0.75 4.44365 0.75 9C0.75 13.5563 4.44365 17.25 9 17.25Z" fill="#0E5F4A"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M9 17.25C13.5563 17.25 17.25 13.5563 17.25 9C17.25 4.44365 13.5563 0.75 9 0.75C4.44365 0.75 0.75 4.44365 0.75 9C0.75 13.5563 4.44365 17.25 9 17.25ZM9 8.25C8.58579 8.25 8.25 8.58579 8.25 9V12C8.25 12.4142 8.58579 12.75 9 12.75C9.41421 12.75 9.75 12.4142 9.75 12V9C9.75 8.58579 9.41421 8.25 9 8.25ZM9 5.25C8.58579 5.25 8.25 5.58579 8.25 6C8.25 6.41421 8.58579 6.75 9 6.75C9.41421 6.75 9.75 6.41421 9.75 6C9.75 5.58579 9.41421 5.25 9 5.25Z" fill="#E7EFED"/>
</svg>
`;

        header.appendChild(icon);
        header.appendChild(titleText);

        tooltipContent.appendChild(header);
      }

      const body = document.createElement("div");
      body.className = "tooltip-body";
      body.innerText = content;
      tooltipContent.appendChild(body);

      const arrow = document.createElement("div");
      arrow.className = "tooltip-arrow tooltip-arrow-bottom";
      tooltipContent.appendChild(arrow);

      tooltip.appendChild(tooltipContent);
      document.body.appendChild(tooltip);

      positionTooltip(el, tooltip, arrow);

      requestAnimationFrame(() => {
        tooltip?.classList.add("show");
      });
    };

    const removeTooltip = () => {
      if (!tooltip) return;

      tooltip?.classList.remove("show");
      tooltip.remove();
      tooltip = null;
    };

    const positionTooltip = (el, tooltip, arrow) => {
      const rect = el.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      let top = rect.bottom + 12;
      let left = rect.left + rect.width / 2 - tooltipRect.width / 2;

      // If overflow bottom → show above
      if (top + tooltipRect.height > window.innerHeight - 10) {
        top = rect.top - tooltipRect.height - 12;
        arrow.className = "tooltip-arrow tooltip-arrow-top";
      }

      if (left < 10) left = 10;
      if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
      }

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    };

    // Show on hover
    el.addEventListener("mouseenter", createTooltip);

    // Hide immediately when not hovering
    el.addEventListener("mouseleave", removeTooltip);

    // Optional: hide if scrolling
    window.addEventListener("scroll", removeTooltip);

    // Cleanup
    el._tooltipCleanup = () => {
      removeTooltip();
      el.removeEventListener("mouseenter", createTooltip);
      el.removeEventListener("mouseleave", removeTooltip);
      window.removeEventListener("scroll", removeTooltip);
    };
  },

  unmounted(el) {
    if (el._tooltipCleanup) {
      el._tooltipCleanup();
    }
  },
};
