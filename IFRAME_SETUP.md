# Embedding Map Feature Using Iframe

This README provides instructions on how to embed the map feature from our repository into your website using an iframe. The embedded map supports a toggle feature that switches between global notes and institution-specific notes.

## Prerequisites
- Ensure that your website allows the embedding of iframes.
- You should have a basic understanding of HTML and how to edit your website's code.

## Embedding the Iframe
To embed the map into your website, follow these steps:

1. **Basic Iframe Embedding**: 
   - Use the following HTML code to embed the map:
     ```html
     <iframe src="https://wheresreligion.netlify.app/lib/pages/map" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
     ```
   - Replace `https://wheresreligion.netlify.app/lib/pages/map` with the actual URL of the map feature on your website.
   - Adjust the `width` and `height` attributes to fit your layout needs.

2. **Using the 'Institution' Argument**:
   - To display institution-specific notes, append a query parameter `?institution=YOUR_INSTITUTION_NAME` to the iframe's `src` URL. 
   - For example:
     ```html
     <iframe src="https://wheresreligion.netlify.app/lib/pages/map?institution=harvard" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
     ```
   - Replace `harvard` with the identifier for the institution whose notes you want to display.

## Toggle Feature
- The map embedded through the iframe includes a toggle switch.
- This switch allows users to toggle between viewing global notes and the notes specific to the institution set in the URL parameter.

## Security and Best Practices
- Always validate and sanitize any URL parameters used to prevent security vulnerabilities.
- Keep your embedded map's URL up-to-date with any changes made to the source map feature.

## Support and Contribution
- For support, please open an issue in our repository.
- Contributions to enhance this feature are welcome. Please follow our contribution guidelines.
