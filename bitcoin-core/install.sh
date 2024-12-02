curl -o bitcoin-28.0-x86_64-linux-gnu.tar.gz https://bitcoincore.org/bin/bitcoin-core-28.0/bitcoin-28.0-x86_64-linux-gnu.tar.gz
tar -xzvf bitcoin-28.0-x86_64-linux-gnu.tar.gz

sudo ufw allow 8332

./bitcoin-28.0/bin/bitcoind -daemon -prune=25000 -rest=1 -rpcallowip=0.0.0.0/0 -rpcbind=0.0.0.0 -rpcpassword=password -rpcuser=username -server
