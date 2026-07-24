package catalog

import (
	"embed"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
)

//go:embed juno_catalog_taxonomy_v2.json
var catalogTaxonomyFS embed.FS

type CatalogTaxonomy struct {
	Departments        []string                       `json:"departments"`
	Gender             []string                       `json:"gender"`
	ProductHierarchy   map[string]map[string][]string `json:"product_hierarchy"`
	StyleCategories    []string                       `json:"style_categories"`
	Aesthetics         []string                       `json:"aesthetics"`
	Occasions          []string                       `json:"occasions"`
	Fit                []string                       `json:"fit"`
	SleeveLength       []string                       `json:"sleeve_length"`
	Neckline           []string                       `json:"neckline"`
	Materials          []string                       `json:"materials"`
	Patterns           []string                       `json:"patterns"`
	WorkDetails        []string                       `json:"work_details"`
	ColorFamilies      []string                       `json:"color_families"`
	Seasonality        []string                       `json:"seasonality"`
	ValidationStatuses []string                       `json:"validation_statuses"`
	NormalizationRules struct {
		Gender map[string]string `json:"gender"`
	} `json:"normalization_rules"`
}

var (
	catalogTaxonomyOnce sync.Once
	catalogTaxonomy     CatalogTaxonomy
	catalogTaxonomyErr  error
)

func LoadCatalogTaxonomy() (CatalogTaxonomy, error) {
	catalogTaxonomyOnce.Do(func() {
		raw, err := catalogTaxonomyFS.ReadFile("juno_catalog_taxonomy_v2.json")
		if err != nil {
			catalogTaxonomyErr = fmt.Errorf("read catalog taxonomy: %w", err)
			return
		}
		if err := json.Unmarshal(raw, &catalogTaxonomy); err != nil {
			catalogTaxonomyErr = fmt.Errorf("decode catalog taxonomy: %w", err)
			return
		}
		for k, v := range catalogTaxonomy.NormalizationRules.Gender {
			catalogTaxonomy.NormalizationRules.Gender[strings.ToLower(strings.TrimSpace(k))] = v
		}
	})
	return catalogTaxonomy, catalogTaxonomyErr
}
