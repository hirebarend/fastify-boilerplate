import axios from 'axios';
import { Block } from 'bitcore-lib';

(async () => {
  const response = await axios.get(
    `https://blockstream.info/api/block/00000000000000000000b1c6d20ae5cbd07ebad28c656ce02cc72616f494bcde/raw`,
    {
      responseType: 'arraybuffer',
    },
  );

  const block = new Block(response.data);

  console.log(block.transactions[5].outputs[0].script.toAddress().toString());
})();
