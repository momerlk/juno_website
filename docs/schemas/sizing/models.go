package sizing

// Normalized size-chart documents are shared by every product using the same
// retailer guide. SizeCharts keeps the product-to-chart link and source status.
type MeasurementRange struct {
	Min float64 `json:"min" bson:"min"`
	Max float64 `json:"max" bson:"max"`
}

type ChartRow struct {
	Size   string                      `json:"size" bson:"size"`
	Values map[string]MeasurementRange `json:"values" bson:"values"`
}

type ChartSection struct {
	ID              string     `json:"id" bson:"id"`
	Label           string     `json:"label" bson:"label"`
	AppliesToGroups []string   `json:"applies_to_groups" bson:"applies_to_groups"`
	AppliesToTypes  []string   `json:"applies_to_types" bson:"applies_to_types"`
	Measurements    []string   `json:"measurements" bson:"measurements"`
	Rows            []ChartRow `json:"rows" bson:"rows"`
}

type ChartData struct {
	Unit              string         `json:"unit" bson:"unit"`
	MeasurementBasis  string         `json:"measurement_basis" bson:"measurement_basis"`
	MeasurementMethod string         `json:"measurement_method" bson:"measurement_method"`
	Sections          []ChartSection `json:"sections" bson:"sections"`
	Notes             []string       `json:"notes,omitempty" bson:"notes,omitempty"`
}

type NormalizedChart struct {
	ID     string    `json:"id" bson:"id"`
	Status string    `json:"status" bson:"status"`
	Chart  ChartData `json:"chart" bson:"chart"`
}

type Variant struct {
	ID        string            `json:"variant_id" bson:"id"`
	Title     string            `json:"title" bson:"title"`
	Options   map[string]string `json:"options" bson:"options"`
	Available bool              `json:"available" bson:"available"`
}

type Product struct {
	ID       string `bson:"id"`
	Metadata struct {
		ProductGroup string `bson:"product_group"`
		ProductType  string `bson:"product_type"`
		Gender       string `bson:"gender"`
	} `bson:"metadata"`
	Variants []Variant `bson:"variants"`
}

type Question struct {
	ID            string                  `json:"id"`
	Type          string                  `json:"type"`
	Label         string                  `json:"label"`
	Options       []QuestionOption        `json:"options,omitempty"`
	Illustrations map[string]Illustration `json:"illustrations,omitempty"`
	Optional      bool                    `json:"optional,omitempty"`
	Unit          string                  `json:"unit,omitempty"`
}

type QuestionOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
}

type Illustration struct {
	LightURL string `json:"light_url"`
	DarkURL  string `json:"dark_url"`
}

type Quiz struct {
	Profile              string     `json:"profile"`
	ProductType          string     `json:"product_type"`
	MeasurementUnit      string     `json:"measurement_unit,omitempty"`
	Questions            []Question `json:"questions"`
	OptionalMeasurements []string   `json:"optional_measurements,omitempty"`
	ChartID              string     `json:"chart_id,omitempty"`
	ChartSectionID       string     `json:"chart_section_id,omitempty"`
}

type ProductSizing struct {
	ProductID    string           `json:"product_id"`
	Availability string           `json:"availability"`
	Chart        *NormalizedChart `json:"chart,omitempty"`
	Section      *ChartSection    `json:"section,omitempty"`
	Variants     []Variant        `json:"variants"`
	Quiz         *Quiz            `json:"quiz,omitempty"`
	sections     []ChartSection
}

type RecommendationRequest struct {
	UsualSize       string             `json:"usual_size,omitempty"`
	Fit             string             `json:"fit,omitempty"`
	Answers         map[string]string  `json:"answers,omitempty"`
	Measurements    map[string]float64 `json:"measurements,omitempty"`
	MeasurementUnit string             `json:"measurement_unit,omitempty"`
}

type Confidence struct {
	Level string  `json:"level"`
	Score float64 `json:"score"`
}

type Alternative struct {
	Size   string `json:"size"`
	Reason string `json:"reason"`
}

type Recommendation struct {
	RecommendedSize  string            `json:"recommended_size"`
	VariantID        string            `json:"variant_id"`
	Confidence       Confidence        `json:"confidence"`
	Alternative      *Alternative      `json:"alternative,omitempty"`
	FitAnalysis      map[string]string `json:"fit_analysis"`
	Reason           string            `json:"reason"`
	Warnings         []string          `json:"warnings"`
	ChartID          string            `json:"chart_id"`
	AlgorithmVersion string            `json:"algorithm_version"`
}
