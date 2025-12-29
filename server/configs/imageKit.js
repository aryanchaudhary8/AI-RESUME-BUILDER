import ImageKit from '@imagekit/nodejs';

const imagekit = new ImageKit({
  privateKey: process.envIMAGEKIT_PRIVATE_KEY,
});

export default imagekit