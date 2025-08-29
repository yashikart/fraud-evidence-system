# Hybrid Storage System

## Overview

The Fraud Evidence System implements a hybrid storage solution that combines:
1. **Local Cache** - Fast access for active investigators
2. **Amazon S3** - Reliable, scalable cloud backup
3. **IPFS** - Immutable, decentralized proof of evidence

## How It Works

### Storage Workflow
When a file is uploaded:
1. Saved to local cache for fast access
2. Uploaded to IPFS for decentralized storage
3. Uploaded to S3 for cloud backup
4. All references stored in the database

### Retrieval Workflow
When a file is requested:
1. First check local cache (fastest)
2. If not available, fallback to S3
3. If not available, fallback to IPFS
4. Retrieved files are cached for future access

## Configuration

### Environment Variables

```bash
# Local Cache Configuration
LOCAL_CACHE_DIR=/var/cache/evidence/
CACHE_MAX_AGE_HOURS=168

# AWS S3 Configuration
ENABLE_S3=false
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=fraud-evidence-system

# IPFS Configuration
ENABLE_IPFS=false
IPFS_API_URL=http://localhost:5001
```

### Enabling Storage Services

1. **Local Cache**: Always enabled, no configuration needed
2. **Amazon S3**: Set `ENABLE_S3=true` and provide AWS credentials
3. **IPFS**: Set `ENABLE_IPFS=true` and provide IPFS API URL

## Usage

### Uploading Files

```javascript
const fileBuffer = // ... file content as buffer
const filename = 'evidence-file.pdf';

const storageResult = await hybridStorageService.saveFile(fileBuffer, filename);
// Returns: { local_path, ipfs_hash, s3_url }
```

### Retrieving Files

```javascript
const filename = 'evidence-file.pdf';
const ipfsHash = 'Qm...'; // IPFS hash from database

const fileResult = await hybridStorageService.retrieveFile(filename, ipfsHash);
// Returns: { success, fileBuffer, source }
```

## Benefits

### Local Cache
- Fastest retrieval for active investigators
- Reduced latency for frequently accessed files

### Amazon S3
- Reliable, scalable cloud backup
- Enterprise-grade durability and availability

### IPFS
- Immutable, decentralized proof of evidence
- Tamper-proof storage
- Decentralized access without single point of failure

## Testing

Run the test script to verify the implementation:

```bash
node test_hybrid_storage.js
```

## Documentation

See [HYBRID_STORAGE_IMPLEMENTATION.md](Documentation/HYBRID_STORAGE_IMPLEMENTATION.md) for detailed implementation information.