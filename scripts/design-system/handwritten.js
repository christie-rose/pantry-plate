(function () {
  var R = window.React, h = R.createElement;
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(" "); }
  var PATHS = {
    menu: "M3 4H21V6H3V4ZM3 11H21V13H3V11ZM3 18H21V20H3V18Z",
    close: "M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z",
    add: "M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z",
    more: "M12 3C10.9 3 10 3.9 10 5C10 6.1 10.9 7 12 7C13.1 7 14 6.1 14 5C14 3.9 13.1 3 12 3ZM12 17C10.9 17 10 17.9 10 19C10 20.1 10.9 21 12 21C13.1 21 14 20.1 14 19C14 17.9 13.1 17 12 17ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10Z",
    book: "M13 21V23H11V21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H9C10.1947 3 11.2671 3.52375 12 4.35418C12.7329 3.52375 13.8053 3 15 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H13ZM20 19V5H15C13.8954 5 13 5.89543 13 7V19H20ZM11 19V7C11 5.89543 10.1046 5 9 5H4V19H11Z",
    cart: "M4.00488 16V4H2.00488V2H5.00488C5.55717 2 6.00488 2.44772 6.00488 3V15H18.4433L20.4433 7H8.00488V5H21.7241C22.2764 5 22.7241 5.44772 22.7241 6C22.7241 6.08176 22.7141 6.16322 22.6942 6.24254L20.1942 16.2425C20.083 16.6877 19.683 17 19.2241 17H5.00488C4.4526 17 4.00488 16.5523 4.00488 16ZM6.00488 23C4.90031 23 4.00488 22.1046 4.00488 21C4.00488 19.8954 4.90031 19 6.00488 19C7.10945 19 8.00488 19.8954 8.00488 21C8.00488 22.1046 7.10945 23 6.00488 23ZM18.0049 23C16.9003 23 16.0049 22.1046 16.0049 21C16.0049 19.8954 16.9003 19 18.0049 19C19.1095 19 20.0049 19.8954 20.0049 21C20.0049 22.1046 19.1095 23 18.0049 23Z",
    cal: "M9 1V3H15V1H17V3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H7V1H9ZM20 11H4V19H20V11ZM7 5H4V9H20V5H17V7H15V5H9V7H7V5Z",
    gear: "M3.33946 17.0002C2.90721 16.2515 2.58277 15.4702 2.36133 14.6741C3.3338 14.1779 3.99972 13.1668 3.99972 12.0002C3.99972 10.8345 3.3348 9.824 2.36353 9.32741C2.81025 7.71651 3.65857 6.21627 4.86474 4.99001C5.7807 5.58416 6.98935 5.65534 7.99972 5.072C9.01009 4.48866 9.55277 3.40635 9.4962 2.31604C11.1613 1.8846 12.8847 1.90004 14.5031 2.31862C14.4475 3.40806 14.9901 4.48912 15.9997 5.072C17.0101 5.65532 18.2187 5.58416 19.1346 4.99007C19.7133 5.57986 20.2277 6.25151 20.66 7.00021C21.0922 7.7489 21.4167 8.53025 21.6381 9.32628C20.6656 9.82247 19.9997 10.8336 19.9997 12.0002C19.9997 13.166 20.6646 14.1764 21.6359 14.673C21.1892 16.2839 20.3409 17.7841 19.1347 19.0104C18.2187 18.4163 17.0101 18.3451 15.9997 18.9284C14.9893 19.5117 14.4467 20.5941 14.5032 21.6844C12.8382 22.1158 11.1148 22.1004 9.49633 21.6818C9.55191 20.5923 9.00929 19.5113 7.99972 18.9284C6.98938 18.3451 5.78079 18.4162 4.86484 19.0103C4.28617 18.4205 3.77172 17.7489 3.33946 17.0002ZM8.99972 17.1964C10.0911 17.8265 10.8749 18.8227 11.2503 19.9659C11.7486 20.0133 12.2502 20.014 12.7486 19.9675C13.1238 18.8237 13.9078 17.8268 14.9997 17.1964C16.0916 16.5659 17.347 16.3855 18.5252 16.6324C18.8146 16.224 19.0648 15.7892 19.2729 15.334C18.4706 14.4373 17.9997 13.2604 17.9997 12.0002C17.9997 10.74 18.4706 9.5632 19.2729 8.6665C19.1688 8.4405 19.0538 8.21822 18.9279 8.00021C18.802 7.78219 18.667 7.57148 18.5233 7.36842C17.3457 7.61476 16.0911 7.43414 14.9997 6.80405C13.9083 6.17395 13.1246 5.17768 12.7491 4.03455C12.2509 3.98714 11.7492 3.98646 11.2509 4.03292C10.8756 5.17671 10.0916 6.17364 8.99972 6.80405C7.9078 7.43447 6.65245 7.61494 5.47428 7.36803C5.18485 7.77641 4.93463 8.21117 4.72656 8.66637C5.52881 9.56311 5.99972 10.74 5.99972 12.0002C5.99972 13.2604 5.52883 14.4372 4.72656 15.3339C4.83067 15.5599 4.94564 15.7822 5.07152 16.0002C5.19739 16.2182 5.3324 16.4289 5.47612 16.632C6.65377 16.3857 7.90838 16.5663 8.99972 17.1964ZM11.9997 15.0002C10.3429 15.0002 8.99972 13.6571 8.99972 12.0002C8.99972 10.3434 10.3429 9.00021 11.9997 9.00021C13.6566 9.00021 14.9997 10.3434 14.9997 12.0002C14.9997 13.6571 13.6566 15.0002 11.9997 15.0002ZM11.9997 13.0002C12.552 13.0002 12.9997 12.5525 12.9997 12.0002C12.9997 11.4479 12.552 11.0002 11.9997 11.0002C11.4474 11.0002 10.9997 11.4479 10.9997 12.0002C10.9997 12.5525 11.4474 13.0002 11.9997 13.0002Z",
    out: "M5 22C4.44772 22 4 21.5523 4 21V3C4 2.44772 4.44772 2 5 2H19C19.5523 2 20 2.44772 20 3V6H18V4H6V20H18V18H20V21C20 21.5523 19.5523 22 19 22H5ZM18 16V13H11V11H18V8L23 12L18 16Z",
    trash: "M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z"
  };
  function Icon(p) {
    return h("svg", { width: p.size || 20, height: p.size || 20, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true }, h("path", { d: PATHS[p.name] }));
  }
  function Card(p) { return h("div", { className: cx("at-card", p.className) }, p.title ? h("h3", null, p.title) : null, p.children); }
  function GroceryRow(p) {
    return h("li", { className: cx("at-row", p.checked && "at-done") },
      h("div", { className: "at-row-main" },
        h("input", { type: "checkbox", checked: !!p.checked, onChange: p.onToggle, "aria-label": "Check off " + p.name }),
        h("button", { type: "button", className: "at-text", title: "Click to edit", onClick: p.onEdit }, p.name)),
      p.tag ? h(window.ATavola.TagChip, null, p.tag) : null);
  }
  function GroceryList(p) { return h("ul", { className: "at-list" }, p.children); }
  function AddButton(p) { return h("button", { type: "button", className: "at-add", "aria-label": "Add item", onClick: p.onClick }, h(Icon, { name: "add", size: 24 })); }
  function ActionsMenu(p) {
    var s = R.useState(!!p.defaultOpen), open = s[0], setOpen = s[1];
    return h("span", { className: "at-menuwrap" },
      h("button", { type: "button", className: "at-kebab", "aria-label": "Actions", "aria-haspopup": "menu", "aria-expanded": open, onClick: function () { setOpen(!open); } }, h(Icon, { name: "more", size: 18 })),
      open ? h("div", { className: "at-menu", role: "menu" }, p.actions.map(function (a) {
        return h("button", { key: a.label, type: "button", role: "menuitem", className: a.danger ? "at-danger" : a.sage ? "at-sage" : "", onClick: function () { setOpen(false); a.onSelect && a.onSelect(); } }, a.icon ? h(Icon, { name: a.icon, size: 16 }) : null, a.label);
      })) : null);
  }
  function Modal(p) {
    return h("div", { className: "at-scrim" }, h("div", { className: "at-modal", role: "dialog", "aria-modal": true, "aria-label": p.title },
      h("div", { className: "at-modal-head" }, h("h2", null, p.title), h("button", { type: "button", className: "at-kebab", "aria-label": "Close", onClick: p.onClose }, h(Icon, { name: "close", size: 18 }))),
      p.children));
  }
  function WeekSelector(p) {
    var B = window.ATavola, h2 = R.createElement;
    function ctl(label, disabled, onClick, extra) {
      return disabled ? h2(B.DisabledButton, null, label) : h2(B.Button, { variant: "secondary", compact: true, onClick: onClick, className: extra }, label);
    }
    return h("div", { className: "at-week" },
      p.isCurrent ? null : ctl("This week", false, p.onThisWeek, "font-medium text-brick"),
      ctl("\u2190 Prev", p.atStart, p.onPrev),
      h("strong", null, p.label),
      ctl("Next \u2192", p.atEnd, p.onNext));
  }
  var ITEMS = [{ label: "Recipes", icon: "book" }, { label: "Grocery List", icon: "cart" }, { label: "Meal Plan", icon: "cal" }];
  function AppNav(p) {
    var B = window.ATavola, items = p.items || ITEMS, st = R.useState(false), open = st[0], setOpen = st[1];
    function go(n) { return function (e) { e.preventDefault(); setOpen(false); p.onNavigate && p.onNavigate(n); }; }
    function link(n, icon, key, muted) {
      return h(B.NavLink, { key: key, href: "#", active: n === p.current, muted: muted, onClick: go(n) }, h(Icon, { name: icon }), n);
    }
    var main = items.map(function (n) { return link(n.label, n.icon, n.label); });
    var foot = [link("Household settings", "gear", "hs"), link("Log out", "out", "lo", true)];
    if (p.layout === "mobile") {
      return h("nav", { className: "at-nav", "aria-label": "Main" },
        h("div", { className: "at-bar" }, h("span", { className: "at-brand" }, "A Tavola"),
          h("button", { type: "button", className: "at-burger", "aria-label": open ? "Close menu" : "Open menu", "aria-expanded": open, onClick: function () { setOpen(!open); } }, h(Icon, { name: open ? "close" : "menu", size: 24 }))),
        open ? h("div", { className: "at-drop" }, main, h("div", { className: "at-drop-foot" }, foot)) : null);
    }
    return h("nav", { className: "at-nav at-side", "aria-label": "Main" },
      h("div", { className: "at-side-main" }, h("span", { className: "at-brand" }, "A Tavola"), main),
      h("div", { className: "at-side-foot" }, foot));
  }
  window.ATavola = Object.assign(window.ATavola || {}, { Card: Card, GroceryRow: GroceryRow, GroceryList: GroceryList, AddButton: AddButton, ActionsMenu: ActionsMenu, Modal: Modal, WeekSelector: WeekSelector, AppNav: AppNav });
})();
