# API Services

This directory contains API service files for making HTTP requests.

## CRUD Service

The `api.js` file provides a generic CRUD service factory that can be used to create services for any resource.

### Usage Example

```javascript
import { crudService } from '@/services/api'

// Create a service for 'users'
const userService = crudService('users')

// Get all users with query parameters
const users = await userService.getAll({ page: 1, limit: 10 })

// Get a single user by ID
const user = await userService.getById(1)

// Create a new user
const newUser = await userService.create({ 
  name: 'John Doe', 
  email: 'john@example.com' 
})

// Update a user (full update - PUT)
const updatedUser = await userService.update(1, { 
  name: 'Jane Doe',
  email: 'jane@example.com'
})

// Partially update a user (PATCH)
const patchedUser = await userService.patch(1, { 
  name: 'Jane Smith' 
})

// Delete a user
await userService.delete(1)
```

### Custom Service Example

For more complex operations, you can extend the base API instance:

```javascript
import api from '@/services/api'

export const attendanceService = {
  // Use CRUD operations
  ...crudService('attendances'),
  
  // Add custom methods
  checkIn: async (employeeId) => {
    const response = await api.post(`/attendances/${employeeId}/check-in`)
    return response.data
  },
  
  checkOut: async (employeeId) => {
    const response = await api.post(`/attendances/${employeeId}/check-out`)
    return response.data
  },
  
  getTodayAttendance: async () => {
    const response = await api.get('/attendances/today')
    return response.data
  }
}
```

## Configuration

The API base URL can be configured via environment variable:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Authentication

The API service automatically includes the authentication token from the auth store in the `Authorization` header for all requests.

## Error Handling

The API service automatically handles 401 (Unauthorized) responses by logging out the user and redirecting to the login page.

