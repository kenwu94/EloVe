# Photo Upload Feature Documentation

## Overview
The EloVe dating app now includes comprehensive photo upload functionality that allows users to:

- Upload up to 6 photos from their device camera or photo library
- Set a main profile photo
- Manage their photo collection
- View photos in the app

## Frontend Components

### PhotoUpload Component
**Location**: `src/components/PhotoUpload.js`

**Features**:
- Photo selection from camera or library
- Image compression and optimization
- Drag to reorder (main photo is always first)
- Delete photos with confirmation
- Set main photo functionality
- Permission handling for camera and photo library access

**Props**:
- `photos`: Array of photo objects
- `onPhotosChange`: Callback function when photos change
- `maxPhotos`: Maximum number of photos (default: 6)
- `style`: Additional styling

### PhotoManagerScreen
**Location**: `src/screens/PhotoManagerScreen.js`

**Features**:
- Full-screen photo management interface
- Photo upload with progress indication
- Set main photo functionality
- Photo deletion with confirmation
- Photo tips and guidelines

### Integration in CreateProfileScreen
**Location**: `src/screens/CreateProfileScreen.js`

**Changes**:
- Added PhotoUpload component to profile creation
- Photo validation (at least one photo required)
- Automatic photo upload during profile creation

### Integration in ProfileScreen
**Location**: `src/screens/ProfileScreen.js`

**Changes**:
- Added "Manage Photos" button in actions section
- Navigation to PhotoManagerScreen

## Backend API

### New Endpoints

#### POST `/api/photos/upload`
Upload a new photo for a user.

**Request Body**:
```json
{
  "user_id": "user-uuid",
  "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

**Response**:
```json
{
  "success": true,
  "photo": {
    "id": "photo-uuid",
    "url": "/uploads/filename.jpg",
    "is_main": false
  }
}
```

#### GET `/api/users/{user_id}/photos`
Get all photos for a user.

**Response**:
```json
{
  "success": true,
  "photos": [
    {
      "id": "photo-uuid",
      "user_id": "user-uuid",
      "url": "/uploads/filename.jpg",
      "is_main": true,
      "created_at": "2024-01-01T00:00:00"
    }
  ]
}
```

#### DELETE `/api/photos/{photo_id}`
Delete a photo.

**Request Body**:
```json
{
  "user_id": "user-uuid"
}
```

#### PUT `/api/photos/{photo_id}/main`
Set a photo as the main photo.

**Request Body**:
```json
{
  "user_id": "user-uuid"
}
```

#### GET `/uploads/{filename}`
Serve uploaded photo files.

### Database Changes

#### New Table: `elove-photos`
**Schema**:
- `id` (String, Primary Key): Unique photo identifier
- `user_id` (String, GSI): User who owns the photo
- `url` (String): Photo file URL
- `is_main` (Boolean): Whether this is the main profile photo
- `created_at` (String): Upload timestamp

**Global Secondary Index**: `user-photos-index` on `user_id`

### File Storage

**Location**: `uploads/` directory in the project root

**Processing**:
- Images are processed with PIL (Pillow)
- Automatic conversion to JPEG format
- Compression with 85% quality
- Thumbnail generation (max 1200px on longest side)
- RGBA/Palette images converted to RGB

**File Naming**: `{user_id}_{random_hash}.jpg`

## Mobile App Dependencies

### New Packages
- `expo-image-picker`: Photo selection from camera/library
- `expo-media-library`: Photo library access permissions

### Installation
```bash
npm install expo-image-picker expo-media-library
```

## Backend Dependencies

### New Packages
- `pillow`: Image processing
- `werkzeug`: File handling utilities

### Installation
```bash
pip install pillow werkzeug
```

## Usage Instructions

### For Users

1. **During Profile Creation**:
   - Add at least one photo using the photo upload section
   - Take a new photo or select from library
   - Photos are automatically uploaded when creating profile

2. **Managing Photos**:
   - Go to Profile tab
   - Tap "Manage Photos" button
   - Add, remove, or reorder photos
   - Set main photo by tapping the star icon

### For Developers

1. **Starting the Backend**:
   ```bash
   cd EloVe
   python app.py
   ```

2. **Starting the Mobile App**:
   ```bash
   cd elove-mobile
   npm start
   ```

3. **Testing Photo Upload**:
   ```bash
   python test_photo_upload.py
   ```

## Security Considerations

1. **File Type Validation**: Only image files are accepted
2. **File Size Limits**: 16MB maximum per file
3. **Image Processing**: All images are re-processed and compressed
4. **User Authentication**: All photo operations require valid user ID

## Performance Optimizations

1. **Image Compression**: Automatic quality reduction to 85%
2. **Size Limits**: Maximum 1200px on longest side
3. **Format Standardization**: All images converted to JPEG
4. **Lazy Loading**: Photos loaded on demand in the app

## Error Handling

1. **Permission Errors**: User-friendly permission request dialogs
2. **Upload Failures**: Retry mechanisms and error messages
3. **Network Issues**: Graceful fallback and status indicators
4. **Storage Issues**: Proper error reporting and cleanup

## Future Enhancements

1. **Cloud Storage**: Integration with AWS S3 or similar
2. **Image Filters**: Basic photo editing capabilities
3. **Photo Verification**: AI-based content moderation
4. **Bulk Operations**: Multiple photo upload at once
5. **Photo Analytics**: View tracking and engagement metrics
