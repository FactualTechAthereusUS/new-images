# Unhinged Creator Portal

A Next.js application for creators to browse, view, and download mockup images from a Printify store.

## Features

- 🛍️ **Browse Products**: View all products from your Printify store in a clean grid layout
- 🔍 **Search & Filter**: Search products by name or tags
- 🖼️ **View Mockups**: Click any product to see all available mockup images
- 📋 **Copy URLs**: Copy individual image URLs or all URLs at once
- 📥 **Download Images**: Download individual images or all images in bulk
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- ⚡ **Modern UI**: Built with Tailwind CSS for a clean, professional look

## Tech Stack

- **Framework**: Next.js 14 with Pages Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **API**: Printify API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Printify account with API access

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd unhinged-creator-portal
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add your Printify API token:
```env
NEXT_PUBLIC_PRINTIFY_TOKEN=your_printify_api_token_here
```

4. Get your Printify API token:
   - Go to https://printify.com/app/account/api
   - Create a new API token
   - Copy the token and paste it in your `.env.local` file

5. Start the development server:
```bash
npm run dev
```

6. Open http://localhost:3000 in your browser

## API Configuration

The application automatically detects your Printify shop. If you have multiple shops, it will use the first one found. The API token should have the following permissions:

- `shops.read`
- `products.read`
- `uploads.read`

## Usage

### Browsing Products

1. The home page displays all products from your Printify store
2. Use the search bar to filter products by name or tags
3. Click on any product to view detailed mockups

### Viewing Product Details

1. Click on a product from the home page
2. View the large preview image on the left
3. Browse all available mockups in the grid on the right
4. Click any thumbnail to view it in the large preview

### Copying & Downloading

**Individual Actions:**
- Click "Copy URL" to copy the image URL to clipboard
- Click "Download" to download the image to your device

**Bulk Actions:**
- Click "Copy All URLs" to copy all image URLs (one per line)
- Click "Download All" to download all images at once

## Project Structure

```
unhinged-creator-portal/
├── components/
│   └── ProductCard.tsx          # Product card component
├── pages/
│   ├── _app.tsx                 # App wrapper
│   ├── index.tsx                # Home page
│   └── product/
│       └── [id].tsx             # Product detail page
├── styles/
│   └── globals.css              # Global styles
├── utils/
│   └── printify.ts              # Printify API utilities
├── .env.local                   # Environment variables
└── README.md                    # This file
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_PRINTIFY_TOKEN` | Your Printify API token | Yes |

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Adding Features

The codebase is structured to be easily extensible:

1. **API utilities** are in `utils/printify.ts`
2. **TypeScript interfaces** are defined for type safety
3. **Responsive design** uses Tailwind CSS utilities
4. **Error handling** is implemented throughout

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy to your preferred platform (Vercel, Netlify, etc.)

3. Make sure to set the environment variables on your deployment platform

## Troubleshooting

### Common Issues

**"Failed to fetch products"**
- Check that your API token is correct
- Verify the token has the required permissions
- Ensure you have products in your Printify shop

**Images not loading**
- Printify images are hosted on their CDN
- Check your network connection
- Verify the product has mockup images

**Search not working**
- Search looks for matches in product titles and tags
- Try different search terms
- Check that your products have titles and tags

## License

This project is licensed under the MIT License.

## Support

For issues related to:
- **This application**: Create an issue in this repository
- **Printify API**: Contact Printify support
- **Next.js**: Check the [Next.js documentation](https://nextjs.org/docs) 