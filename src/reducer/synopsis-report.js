export default (state = null, { type, payload }) => {
  switch (type) {
    case 'SYNOPSIS_REPORT_SET':
      return payload;
    case 'SYNOPSIS_REPORT_CLEAR':
      return null;
    default:
      return state;
  }
};
