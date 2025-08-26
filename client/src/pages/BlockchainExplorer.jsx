import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Eye, Shield, Clock, Hash, Users, Vote } from 'lucide-react';

// Mock data - replace with actual API calls
const mockBlockchainData = [
  {
    index: 0,
    timestamp: "2024-01-15T10:00:00Z",
    hash: "000abc123def456789...",
    prevHash: "0000000000000000000...",
    transactions: [],
    merkleRoot: "abc123def456...",
    nonce: 12345
  },
  {
    index: 1,
    timestamp: "2024-01-15T10:05:00Z",
    hash: "000def456ghi789abc...",
    prevHash: "000abc123def456789...",
    merkleRoot: "def456ghi789...",
    nonce: 67890,
    transactions: [
      {
        id: "tx001",
        sender: "admin",
        receiver: "candidate001",
        payload: "ADD_CANDIDATE:John Doe:Experienced leader with 10 years in public service",
        timestamp: "2024-01-15T10:04:30Z",
        type: "ADD_CANDIDATE"
      },
      {
        id: "tx002",
        sender: "admin",
        receiver: "candidate002",
        payload: "ADD_CANDIDATE:Jane Smith:Environmental activist and policy expert",
        timestamp: "2024-01-15T10:04:45Z",
        type: "ADD_CANDIDATE"
      }
    ]
  },
  {
    index: 2,
    timestamp: "2024-01-15T10:10:00Z",
    hash: "000ghi789jkl012mno...",
    prevHash: "000def456ghi789abc...",
    merkleRoot: "ghi789jkl012...",
    nonce: 24680,
    transactions: [
      {
        id: "tx003",
        sender: "voter001",
        receiver: "candidate001",
        payload: "VOTE",
        timestamp: "2024-01-15T10:09:15Z",
        type: "VOTE"
      },
      {
        id: "tx004",
        sender: "voter002",
        receiver: "candidate002",
        payload: "VOTE",
        timestamp: "2024-01-15T10:09:30Z",
        type: "VOTE"
      },
      {
        id: "tx005",
        sender: "voter003",
        receiver: "candidate001",
        payload: "VOTE",
        timestamp: "2024-01-15T10:09:45Z",
        type: "VOTE"
      }
    ]
  }
];

const BlockchainExplorer = () => {
  const [blocks, setBlocks] = useState([]);
  const [expandedBlocks, setExpandedBlocks] = useState(new Set());
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const loadBlockchainData = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      // const response = await fetch('/api/blockchain/inspect');
      // const data = await response.json();
      
      // For now, use mock data
      setTimeout(() => {
        setBlocks(mockBlockchainData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load blockchain data:', error);
      setLoading(false);
    }
  };

  const toggleBlockExpansion = (blockIndex) => {
    const newExpanded = new Set(expandedBlocks);
    if (newExpanded.has(blockIndex)) {
      newExpanded.delete(blockIndex);
    } else {
      newExpanded.add(blockIndex);
    }
    setExpandedBlocks(newExpanded);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'VOTE':
        return <Vote className="w-4 h-4 text-blue-500" />;
      case 'ADD_CANDIDATE':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'UPDATE_CANDIDATE':
        return <Users className="w-4 h-4 text-yellow-500" />;
      case 'REMOVE_CANDIDATE':
        return <Users className="w-4 h-4 text-red-500" />;
      default:
        return <Hash className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'VOTE':
        return 'bg-blue-100 text-blue-800';
      case 'ADD_CANDIDATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE_CANDIDATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'REMOVE_CANDIDATE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatHash = (hash, length = 16) => {
    if (!hash) return '';
    return hash.length > length ? `${hash.substring(0, length)}...` : hash;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const parseTransactionPayload = (payload, type) => {
  switch (type) {
    case 'ADD_CANDIDATE':
    case 'UPDATE_CANDIDATE': {
      const parts = payload.split(':');
      if (parts.length >= 3) {
        return {
          name: parts[1],
          bio: parts.slice(2).join(':')
        };
      }
      return { name: 'Unknown', bio: payload };
    }
    case 'VOTE':
      return { action: 'Cast Vote' };
    default:
      return { raw: payload };
  }
};

  const filteredBlocks = blocks.filter(block => {
    if (filter === 'votes') {
      return block.transactions.some(tx => tx.type === 'VOTE');
    }
    if (filter === 'candidates') {
      return block.transactions.some(tx => 
        tx.type === 'ADD_CANDIDATE' || tx.type === 'UPDATE_CANDIDATE' || tx.type === 'REMOVE_CANDIDATE'
      );
    }
    return true;
  });

  const searchFilteredBlocks = filteredBlocks.filter(block => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      block.hash.toLowerCase().includes(searchLower) ||
      block.transactions.some(tx => 
        tx.id.toLowerCase().includes(searchLower) ||
        tx.sender.toLowerCase().includes(searchLower) ||
        tx.receiver.toLowerCase().includes(searchLower) ||
        tx.payload.toLowerCase().includes(searchLower)
      )
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-xl text-gray-600">Loading blockchain data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Blockchain Explorer</h1>
          </div>
          <p className="text-gray-600">
            Transparent view of all transactions and blocks in the voting blockchain
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Hash className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{blocks.length}</h3>
                <p className="text-gray-600">Total Blocks</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Vote className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {blocks.reduce((sum, block) => 
                    sum + block.transactions.filter(tx => tx.type === 'VOTE').length, 0
                  )}
                </h3>
                <p className="text-gray-600">Total Votes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {blocks.reduce((sum, block) => 
                    sum + block.transactions.filter(tx => tx.type === 'ADD_CANDIDATE').length, 0
                  )}
                </h3>
                <p className="text-gray-600">Candidates Added</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {blocks.length > 0 ? formatTimestamp(blocks[blocks.length - 1].timestamp).split(',')[0] : 'N/A'}
                </h3>
                <p className="text-gray-600">Last Block</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Blocks</option>
                <option value="votes">Blocks with Votes</option>
                <option value="candidates">Blocks with Candidate Changes</option>
              </select>
              
              <button
                onClick={loadBlockchainData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
            
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by hash, transaction ID, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Blockchain Visualization */}
        <div className="space-y-4">
          {searchFilteredBlocks.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Hash className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No blocks found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            searchFilteredBlocks.reverse().map((block) => (
              <div key={block.index} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Block Header */}
                <div
                  className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleBlockExpansion(block.index)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {expandedBlocks.has(block.index) ? 
                        <ChevronDown className="w-5 h-5 text-gray-500" /> :
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      }
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Hash className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Block #{block.index}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatTimestamp(block.timestamp)} • {block.transactions.length} transactions
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-600 font-mono">
                      Hash: {formatHash(block.hash)}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      Prev: {formatHash(block.prevHash)}
                    </div>
                  </div>
                </div>

                {/* Block Details */}
                {expandedBlocks.has(block.index) && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    {/* Block Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Block Hash</h4>
                        <p className="text-xs font-mono text-gray-600 break-all">{block.hash}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Previous Hash</h4>
                        <p className="text-xs font-mono text-gray-600 break-all">{block.prevHash}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Merkle Root</h4>
                        <p className="text-xs font-mono text-gray-600 break-all">{block.merkleRoot}</p>
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Nonce: {block.nonce}</span>
                        </div>
                      </div>
                    </div>

                    {/* Transactions */}
                    {block.transactions.length > 0 ? (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">
                          Transactions ({block.transactions.length})
                        </h4>
                        <div className="space-y-3">
                          {block.transactions.map((tx) => {
                            const parsedPayload = parseTransactionPayload(tx.payload, tx.type);
                            return (
                              <div
                                key={tx.id}
                                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                                onClick={() => setSelectedTransaction(tx)}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-3">
                                    {getTransactionIcon(tx.type)}
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(tx.type)}`}>
                                      {tx.type}
                                    </span>
                                    <span className="text-sm font-mono text-gray-600">{tx.id}</span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatTimestamp(tx.timestamp)}
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between text-sm">
                                  <div>
                                    <span className="text-gray-600">From:</span>
                                    <span className="ml-2 font-mono text-gray-800">{tx.sender}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">To:</span>
                                    <span className="ml-2 font-mono text-gray-800">{tx.receiver}</span>
                                  </div>
                                </div>

                                {tx.type === 'ADD_CANDIDATE' && (
                                  <div className="mt-2 text-sm">
                                    <span className="text-gray-600">Candidate:</span>
                                    <span className="ml-2 font-semibold">{parsedPayload.name}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Hash className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No transactions in this block</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Transaction Detail Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Transaction ID</label>
                    <p className="font-mono text-sm text-gray-600 bg-gray-100 p-2 rounded break-all">
                      {selectedTransaction.id}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">From</label>
                      <p className="font-mono text-sm text-gray-600 bg-gray-100 p-2 rounded">
                        {selectedTransaction.sender}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">To</label>
                      <p className="font-mono text-sm text-gray-600 bg-gray-100 p-2 rounded">
                        {selectedTransaction.receiver}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Type</label>
                    <div className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTransactionTypeColor(selectedTransaction.type)}`}>
                        {selectedTransaction.type}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Timestamp</label>
                    <p className="text-sm text-gray-600">
                      {formatTimestamp(selectedTransaction.timestamp)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Payload</label>
                    <p className="text-sm text-gray-600 bg-gray-100 p-3 rounded break-all">
                      {selectedTransaction.payload}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockchainExplorer;