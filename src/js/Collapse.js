const Collapse = (($) => {
  const selector = '[data-toggle="collapse"]';

  $(document).on('click', selector, (e) => {
    const $el = $(e.target);
    const collapse = $el.data('target');

    $(collapse).toggleClass('show');
  });
})(jQuery);

export default Collapse;
