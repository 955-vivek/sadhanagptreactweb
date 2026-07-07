
export const processResponse = (response) => {
  if (!response) {
    return {
      message: 'Network error',
      type: 'error'
    };
  }

  const data = response;

  // Extract message (handling array or string)
  let rawMessage = data.message;
  if (Array.isArray(rawMessage)) {
    rawMessage = rawMessage[0];
  }

  // Determine type
  let type = 'success';
  if ( data.code === 400) {
    type = 'error';
  } else if (data.code === 422) {
    type = 'warning';
  }

  return {
    message: rawMessage || (type === 'success' ? 'Success' : 'Error'),
    type
  };
};

