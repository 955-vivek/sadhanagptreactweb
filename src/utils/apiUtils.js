export const processResponse = (response) => {
  if (!response) {
    return {
      message: 'Network error',
      type: 'error'
    };
  }

  const data = response.data || response;

  // Extract message (handling array, object, or string)
  let rawMessage = data.message;
  if (Array.isArray(rawMessage)) {
    rawMessage = rawMessage[0];
  } else if (data.errors) {
    if (Array.isArray(data.errors)) {
      rawMessage = data.errors[0];
    } else if (typeof data.errors === 'object') {
      const keys = Object.keys(data.errors);
      if (keys.length > 0) {
        const val = data.errors[keys[0]];
        rawMessage = Array.isArray(val) ? val[0] : val;
      }
    }
  }

  // Determine type
  let type = 'success';
  if (
    data.status === 0 ||
    data.status === false ||
    data.status === '0' ||
    data.code === 400 ||
    data.code === 422 ||
    (typeof data.code === 'number' && data.code >= 400)
  ) {
    type = 'error';
  } else if (
    data.status === 1 ||
    data.status === true ||
    data.status === '1' ||
    data.code === 200 ||
    data.code === 201
  ) {
    type = 'success';
  }

  return {
    message: rawMessage || (type === 'success' ? 'Success' : 'Error'),
    type
  };
};

export const flattenMessage = (message) => {
  if (!message) return "";
  if (Array.isArray(message)) return message[0];
  return String(message);
};
