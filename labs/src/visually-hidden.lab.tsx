import { CopyGlyph, DeleteGlyph, EditGlyph } from '../../src/core/glyphs.js';
import { Badge } from '../../src/components/badge/badge.js';
import { Button } from '../../src/components/button/button.js';
import { CopyButton } from '../../src/components/copy-button/copy-button.js';
import { Link } from '../../src/components/link/link.js';
import { Shortcut } from '../../src/components/shortcut/shortcut.js';
import { VisuallyHidden } from '../../src/components/visually-hidden/visually-hidden.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const recipes = ['Lemon tart', 'Plum crumble', 'Pear galette'];
const categories = ['Breakfast', 'Lunch', 'Dinner', 'Desserts', 'Drinks'];

function RecipeActions({ name }: { name: string }) {
  return (
    <li data-lab-recipe={name}>
      <span>{name}</span>{' '}
      <Button variant="ghost" size="sm" content="parts" startIcon={EditGlyph}>
        <VisuallyHidden as="span">Edit {name}</VisuallyHidden>
      </Button>
      <Button variant="ghost" size="sm" content="parts" startIcon={CopyGlyph}>
        <VisuallyHidden as="span">Duplicate {name}</VisuallyHidden>
      </Button>
      <Button variant="ghost" size="sm" content="parts" startIcon={DeleteGlyph}>
        <VisuallyHidden as="span">Delete {name}</VisuallyHidden>
      </Button>
    </li>
  );
}

function Rating({ stars }: { stars: number }) {
  return (
    <span data-lab-rating={stars}>
      <span aria-hidden="true">{'★'.repeat(stars) + '☆'.repeat(5 - stars)}</span>
      <VisuallyHidden as="span">{`${stars} out of 5 stars`}</VisuallyHidden>
    </span>
  );
}

function SkipLink() {
  return (
    <div data-lab-demo="skip">
      <Button size="sm">Recipe menu</Button>
      <VisuallyHidden isFocusable>
        <Link href="#lab-recipes" isStandalone>
          Skip to recipes
        </Link>
      </VisuallyHidden>
      <nav aria-label="Categories">
        <ul>
          {categories.map((category) => (
            <li key={category}>
              <Link href={`#lab-${category.toLowerCase()}`} isStandalone>
                {category}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <section id="lab-recipes" tabIndex={-1} aria-labelledby="lab-recipes-heading">
        <h3 id="lab-recipes-heading">Recipes</h3>
        <p>Seasonal recipes, newest first.</p>
      </section>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Elements and focus"
      description="Hidden text in a div or a span, and focusable content that shows while it has focus. Tab to the links to reveal them."
    >
      <StateMatrix
        axes={{ as: ['div', 'span'], isFocusable: ['false', 'true'] }}
        render={({ as, isFocusable }) => (
          <div>
            Apples, 4 €
            <VisuallyHidden as={as} isFocusable={isFocusable === 'true'}>
              {isFocusable === 'true' ? (
                <a href="#lab-price-notes">Price notes</a>
              ) : (
                ' per kilogram'
              )}
            </VisuallyHidden>
          </div>
        )}
      />
      <p id="lab-price-notes">Prices are per kilogram and include tax.</p>
    </LabSection>
    <LabSection
      title="Names for icon-only buttons"
      description="Each icon button holds its name in hidden text, so readers hear which recipe it acts on."
    >
      <ul data-lab-demo="icon-buttons">
        {recipes.map((name) => (
          <RecipeActions key={name} name={name} />
        ))}
      </ul>
    </LabSection>
    <LabSection
      title="Context for short values"
      description="Star ratings drawn with symbols read as a sentence."
    >
      <ul data-lab-demo="ratings">
        <li>
          Lemon tart <Rating stars={4} />
        </li>
        <li>
          Plum crumble <Rating stars={5} />
        </li>
      </ul>
    </LabSection>
    <LabSection
      title="Inside components"
      description="A spoken status dot, a shortcut's spoken keys and a copy button's status: each component's hidden text is a VisuallyHidden, so it carries the ui-visually-hidden hook."
    >
      <p data-lab-demo="components">
        <Badge variant="dot" tone="success" aria-label="Recipe published" /> Lemon tart{' '}
        <Shortcut chord="Ctrl+Shift+K" platform="windows" /> <CopyButton value="Lemon tart" />
      </p>
    </LabSection>
    <LabSection
      title="Skip link"
      description="Focus the menu button and press Tab: the skip link shows while focused, and Enter moves past the category links to the recipes."
    >
      <SkipLink />
    </LabSection>
  </>,
);
